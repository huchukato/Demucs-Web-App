from flask import Flask, request, jsonify, send_from_directory, send_file
from flask_cors import CORS
import demucs.separate
import shlex
import os
import time
from pathlib import Path
from werkzeug.utils import secure_filename
import shutil
import uuid

app = Flask(__name__, static_folder=os.path.abspath('static'), static_url_path='')
CORS(app)

@app.errorhandler(413)
def file_too_large(error):
    return jsonify({"error": "File is too large. Maximum size is 20MB."}), 413

app.config['MAX_CONTENT_LENGTH'] = 20 * 1024 * 1024  # 20MB in bytes

# Define base directories
BASE_DIR = Path('/teamspace/studios/this_studio/Demucs-Web-App/demucs-backend')
UPLOAD_FOLDER = BASE_DIR / 'temp'
SEPARATED_DIR = BASE_DIR / 'separated'

# Ensure directories exist
UPLOAD_FOLDER.mkdir(parents=True, exist_ok=True)
SEPARATED_DIR.mkdir(parents=True, exist_ok=True)

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def catch_all(path):
    try:
        static_folder = app.static_folder  
        if static_folder is None:  
            return jsonify({'error': 'Static folder not set'}), 500
        return send_from_directory(static_folder, 'index.html')
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
        if file.filename is None or file.filename == '':
            return jsonify({'error': 'No selected file'}), 400

        # Create session directory
        session_id = str(uuid.uuid4())
        session_folder = UPLOAD_FOLDER / session_id
        session_folder.mkdir(parents=True, exist_ok=True)

        # Save uploaded file
        filename = secure_filename(file.filename)
        original_name = Path(filename).stem  # Get filename without extension
        file_path = session_folder / filename
        file.save(str(file_path))
        print(f"File saved to {file_path}")

        # Run Demucs
        try:
            output_dir = session_folder / 'separated'
            demucs.separate.main(shlex.split(f'--mp3 --out {output_dir} "{file_path}"'))
            print(f"Separation complete for {file_path}")
        except Exception as e:
            print(f"Error in Demucs separation: {str(e)}")
            shutil.rmtree(session_folder)
            return jsonify({'error': 'Failed to separate audio file'}), 500

        # Find and prepare separated files
        stems = {}
        model_name = 'htdemucs'  # or whatever model Demucs is using
        separated_track_dir = output_dir / model_name / Path(filename).stem
        
        if not separated_track_dir.exists():
            return jsonify({'error': 'Separated files not found'}), 500

        for stem_file in separated_track_dir.glob('*.mp3'):
            stem_type = stem_file.stem  # e.g., 'drums', 'bass', etc.
            new_filename = f"{original_name}-{stem_type}.mp3"
            new_file_path = session_folder / new_filename
            # Move the file to the session directory with the new name
            shutil.copy2(stem_file, new_file_path)
            stems[stem_type] = f'/download/{session_id}/{new_filename}'

        # Clean up the separated directory but keep the session folder
        shutil.rmtree(output_dir)

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
        if session_folder.exists():
            shutil.rmtree(session_folder)
        return jsonify({'error': str(e)}), 500

@app.route('/download/<session_id>/<filename>')
def download_file(session_id, filename):
    try:
        session_folder = UPLOAD_FOLDER / session_id
        file_path = session_folder / filename
        
        if not file_path.exists():
            return jsonify({'error': 'File not found'}), 404
            
        return send_file(
            str(file_path),  # Convert Path to string
            as_attachment=True,
            mimetype='audio/mpeg',
            download_name=filename
        )
    except Exception as e:
        print(f"Error downloading file: {str(e)}")
        return jsonify({'error': 'Download failed'}), 500

def cleanup_old_files():
    """Remove session folders older than 1 hour"""
    try:
        current_time = time.time()
        for session_folder in UPLOAD_FOLDER.iterdir():
            if session_folder.is_dir():
                folder_age = current_time - session_folder.stat().st_mtime
                if folder_age > 3600:  # 1 hour in seconds
                    shutil.rmtree(session_folder)
    except Exception as e:
        print(f"Error during cleanup: {str(e)}")

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)