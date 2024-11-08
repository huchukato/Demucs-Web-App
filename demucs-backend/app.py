from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from typing import Tuple, Union
import os
from pathlib import Path
from demucs.pretrained import get_model, SOURCES
from demucs.audio import AudioFile, save_audio
from demucs.apply import apply_model
import torch
import numpy as np
from werkzeug.utils import secure_filename

# Print available sources and models
print("Available sources:", SOURCES)
print("Available models:")
for name in ['demucs', 'demucs_extra', 'mdx', 'mdx_extra', 'htdemucs']:
    try:
        model = get_model(name)
        print(f"- {name}: {model.__class__.__name__}")
    except Exception as e:
        print(f"- {name}: Not available ({str(e)})")

app = Flask(__name__)
CORS(app)

# Try to load the 'htdemucs' model, if it fails, use 'mdx_extra' as fallback
try:
    model = get_model('htdemucs')
    print("Successfully loaded 'htdemucs' model")
except Exception as e:
    print(f"Failed to load 'htdemucs': {str(e)}")
    print("Attempting to load 'mdx_extra' as fallback...")
    model = get_model('mdx_extra')
    print("Successfully loaded 'mdx_extra' model")

model.cpu()
model.eval()

@app.route('/process', methods=['POST'])
def process_audio() -> Union[Tuple[Response, int], Tuple[str, int]]:
    file_path = None
    stems = []
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file part'}), 400
        
        file = request.files['file']
        if file.filename is None or file.filename == '':
            return jsonify({'error': 'No selected file'}), 400
        
        filename = secure_filename(file.filename)
        if not filename:
            return jsonify({'error': 'Invalid filename'}), 400
        
        file_path = Path('/src') / filename  # Use a source directory
        file.save(str(file_path))
        
        print(f"File saved to {file_path}")  # Debug print
        
        # Read audio file
        audio = AudioFile(file_path).read(samplerate=model.samplerate, channels=model.audio_channels)
        print(f"Audio read, type: {type(audio)}")  # Debug print
        
        # Convert to tensor and ensure correct shape
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
        
        print(f"Processed audio shape: {audio.shape}")  # Debug print
        
        print("Starting model inference")  # Debug print
        sources = apply_model(model, audio, device='cpu', progress=True)
        print(f"Model inference complete, sources shape: {sources.shape}")  # Debug print
        
        for idx, (source, name) in enumerate(zip(sources[0], model.sources)):
            stem_path = file_path.parent / f'{filename}_{name}.wav'
            save_audio(source, str(stem_path), samplerate=model.samplerate)
            stems.append(str(stem_path))
            print(f"Saved stem {idx+1}/{len(model.sources)}: {stem_path}")  # Debug print
        
        return jsonify({'message': 'Processing complete', 'stems': stems}), 200
    except Exception as e:
        print(f"Error in process_audio: {str(e)}")  # Debug print
        import traceback
        traceback.print_exc()  # This will print the full stack trace
        return jsonify({'error': str(e)}), 500
    finally:
        # Clean up: remove the original file and stems
        if file_path and file_path.exists():
            file_path.unlink()
        for stem in stems:
            stem_path = Path(stem)
            if stem_path.exists():
                stem_path.unlink()

if __name__ == '__main__':
    app.run(debug=True)
