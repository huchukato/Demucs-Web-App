from flask import Flask, request, jsonify, send_from_directory, send_file
from flask_cors import CORS
import demucs.separate
import shlex
import os
from pathlib import Path
from werkzeug.utils import secure_filename
import shutil
import uuid

app = Flask(__name__, static_folder=os.path.abspath('static'), static_url_path='')
CORS(app)

# Cartella per i file temporanei
UPLOAD_FOLDER = Path('/teamspace/studios/this_studio/Demucs-Web-App/demucs-backend/temp')
UPLOAD_FOLDER.mkdir(parents=True, exist_ok=True)

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
    return jsonify({"status": "healthy"})

@app.route('/process', methods=['POST'])
def process_audio():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file part'}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400

        # Crea un ID univoco per questa sessione
        session_id = str(uuid.uuid4())
        session_folder = UPLOAD_FOLDER / session_id
        session_folder.mkdir(parents=True, exist_ok=True)

        filename = secure_filename(file.filename)
        file_path = session_folder / filename
        
        try:
            file.save(str(file_path))
            print(f"File saved to {file_path}")
        except Exception as e:
            print(f"Error saving file: {str(e)}")
            return jsonify({'error': 'Failed to save file'}), 500

        # Esegui Demucs
        try:
            demucs.separate.main(shlex.split(f'--mp3 -n mdx_extra "{file_path}"'))
            print(f"Separation complete for {file_path}")
        except Exception as e:
            print(f"Error in Demucs separation: {str(e)}")
            return jsonify({'error': 'Failed to separate audio file'}), 500

        # Trova i file separati
        separated_dir = file_path.parent / 'separated' / 'mdx_extra' / file_path.stem
        stems = {}
        for stem in separated_dir.glob('*.mp3'):
            # Sposta gli stems nella cartella della sessione
            dest_path = session_folder / stem.name
            shutil.copy2(stem, dest_path)
            stems[stem.stem] = f'/download/{session_id}/{stem.name}'

        print(f"Separated stems: {stems}")
        return jsonify({
            'message': 'Processing complete',
            'session_id': session_id,
            'stems': stems
        }), 200

    except Exception as e:
        print(f"Error in process_audio: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/download/<session_id>/<filename>')
def download_file(session_id, filename):
    try:
        session_folder = UPLOAD_FOLDER / session_id
        file_path = session_folder / filename
        
        if not file_path.exists():
            return jsonify({'error': 'File not found'}), 404
            
        return send_file(
            file_path,
            as_attachment=True,
            mimetype='audio/mpeg',
            download_name=filename
        )
    except Exception as e:
        print(f"Error downloading file: {str(e)}")
        return jsonify({'error': 'Download failed'}), 500

# Funzione di pulizia per rimuovere i file temporanei vecchi
def cleanup_old_files():
    # Implementa la logica di pulizia qui
    pass

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)