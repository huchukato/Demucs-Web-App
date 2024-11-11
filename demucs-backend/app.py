from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from demucs.pretrained import get_model
from demucs.audio import AudioFile, save_audio
from demucs.apply import apply_model
import torch
import numpy as np  # Importa numpy
import os
from pathlib import Path
from werkzeug.utils import secure_filename

# Configurazione iniziale
app = Flask(__name__, static_folder=os.path.abspath('static'), static_url_path='')
CORS(app)

print(f"Static folder absolute path: {os.path.abspath('static')}")

# Configurazione del device (GPU se disponibile, altrimenti CPU)
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

def initialize_model():
    try:
        model = get_model('htdemucs')
        print("Successfully loaded 'htdemucs' model")
        return model.to(device)
    except Exception as e:
        print(f"Failed to load 'htdemucs': {str(e)}")
        print("Attempting to load 'mdx_extra' as fallback...")
        try:
            model = get_model('mdx_extra')
            print("Successfully loaded 'mdx_extra' model")
            return model.to(device)
        except Exception as e:
            print(f"Failed to load 'mdx_extra': {str(e)}")
            return None

model = initialize_model()
if model is None:
    raise RuntimeError("Failed to initialize any model")

@app.route('/')
def home():
    try:
        return send_from_directory(app.static_folder, 'index.html')
    except Exception as e:
        print(f"Error serving index.html: {str(e)}")
        return jsonify({'error': 'File not found'}), 404

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "model": model.__class__.__name__,
        "device": str(device)
    })

@app.route('/process', methods=['POST'])
def process_audio():
    stems = []  # Inizializza la variabile stems
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file part'}), 400

        file = request.files['file']
        if file.filename is None or file.filename == '':
            return jsonify({'error': 'No selected file'}), 400

        filename = secure_filename(file.filename)
        if not filename:
            return jsonify({'error': 'Invalid filename'}), 400

        file_path = Path('/src') / filename
        file.save(str(file_path))

        print(f"File saved to {file_path}")

        audio = AudioFile(file_path).read(samplerate=model.samplerate, channels=model.audio_channels)
        print(f"Audio read, type: {type(audio)}")

        if isinstance(audio, (float, int)):
            audio = torch.tensor([[[audio]]])
        elif isinstance(audio, np.ndarray):
            audio = torch.from_numpy(audio)
            if audio.dim() == 1:
                audio = audio.unsqueeze(0).unsqueeze(0)
            elif audio.dim() == 2:
                audio = audio.unsqueeze(1)
        elif isinstance(audio, torch.Tensor):
            if audio.dim() == 1:
                audio = audio.unsqueeze(0).unsqueeze(0)
            elif audio.dim() == 2:
                audio = audio.unsqueeze(1)
        else:
            raise ValueError(f"Unexpected audio type: {type(audio)}")

        print(f"Processed audio shape: {audio.shape}")

        print("Starting model inference")
        sources = apply_model(model, audio, device=device, progress=True)
        print(f"Model inference complete, sources shape: {sources.shape}")

        for idx, (source, name) in enumerate(zip(sources, model.sources)):
            stem_path = file_path.parent / f'{filename}_{name}.wav'
            save_audio(source, str(stem_path), samplerate=model.samplerate)
            stems.append(str(stem_path))
            print(f"Saved stem {idx+1}/{len(model.sources)}: {stem_path}")

        return jsonify({'message': 'Processing complete', 'stems': stems}), 200
    except Exception as e:
        print(f"Error in process_audio: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
    finally:
        if file_path and file_path.exists():
            file_path.unlink()
        for stem in stems:
            stem_path = Path(stem)
            if stem_path.exists():
                stem_path.unlink()

if __name__ == '__main__':
    app.run(debug=True)
