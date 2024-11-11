from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import demucs.separate
import shlex
import os
from pathlib import Path
from werkzeug.utils import secure_filename
import requests  # Importa l'API requests

# Configurazione iniziale
app = Flask(__name__, static_folder=os.path.abspath('static'), static_url_path='')
CORS(app)

print(f"Static folder path: {app.static_folder}")

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def catch_all(path):
    try:
        return send_from_directory(app.static_folder, 'index.html')
    except Exception as e:
        print(f"Error serving index.html: {str(e)}")
        return jsonify({'error': 'File not found'}), 404

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy"
    })

@app.route('/process', methods=['POST'])
def process_audio():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file part'}), 400

        file = request.files['file']
        if file.filename is None or file.filename == '':
            return jsonify({'error': 'No selected file'}), 400

        filename = secure_filename(file.filename)
        if not filename:
            return jsonify({'error': 'Invalid filename'}), 400

        # Aggiorna il percorso per salvare i file nella directory corretta
        file_path = Path('/teamspace/studios/this_studio/Demucs-Web-App/demucs-backend/src') / filename
        try:
            file.save(str(file_path))
            print(f"File saved to {file_path}")
        except Exception as e:
            print(f"Error saving file: {str(e)}")
            return jsonify({'error': 'Failed to save file'}), 500

        # Esegui il comando di separazione di Demucs senza l'opzione --two-stems
        try:
            demucs.separate.main(shlex.split(f'--mp3 -n mdx_extra "{file_path}"'))
            print(f"Separation complete for {file_path}")
        except Exception as e:
            print(f"Error executing Demucs separation: {str(e)}")
            return jsonify({'error': 'Failed to separate audio file'}), 500

        # Trova i file separati
        separated_dir = file_path.parent / 'separated' / 'mdx_extra' / file_path.stem
        stems = {stem.stem: str(stem) for stem in separated_dir.glob('*.mp3')}
        print(f"Separated stems: {stems}")

        return jsonify({'message': 'Processing complete', 'stems': stems}), 200
    except Exception as e:
        print(f"Error in process_audio: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
    finally:
        if file_path and file_path.exists():
            file_path.unlink()

if __name__ == '__main__':
    # Esegui una richiesta HTTP utilizzando l'API requests
    url = "https://5000-01jc2hgbfh9harp7vdddrbt76a.cloudspaces.litng.ai/"
    response = requests.get(url)
    if response.status_code == 200:
        print("Response:", response.text)
    else:
        print(f"Request failed with status code {response.status_code}.")

    app.run(debug=True)
