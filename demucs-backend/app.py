from flask import Flask, request, jsonify, send_from_directory, send_file
from flask_cors import CORS
import os
import time
import io
import zipfile
import threading
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
BASE_DIR = Path(__file__).parent.absolute()
UPLOAD_FOLDER = BASE_DIR / 'temp'

# Ensure directory exists
UPLOAD_FOLDER.mkdir(parents=True, exist_ok=True)

# Mappatura nomi stem (Demucs "other" = strumentale senza drums/bass/vocals)
STEM_LABELS = {
    'vocals': 'vocals',
    'drums': 'drums',
    'bass': 'bass',
    'other': 'instrumental',
}

# Job system: job_id -> {state, progress, message, stems, analysis, session_id, error}
JOBS = {}
JOBS_LOCK = threading.Lock()


def analyze_audio(file_path):
    """Analizza BPM e chiave musicale di un file audio usando librosa."""
    import librosa
    import numpy as np
    try:
        y, sr = librosa.load(str(file_path), sr=None, mono=True, duration=120)
        # BPM
        tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
        bpm = float(np.ravel(tempo)[0])
        # Chiave musicale: stima chroma + Krumhansl-Schmuckler
        chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
        chroma_mean = chroma.mean(axis=1)
        # Pitch class con maggiore energia
        key_idx = int(np.argmax(chroma_mean))
        # Determina maggiore/minore confrontando profili Krumhansl
        major_profile = np.roll([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88], key_idx)
        minor_profile = np.roll([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17], key_idx)
        major_corr = np.corrcoef(chroma_mean, major_profile)[0, 1]
        minor_corr = np.corrcoef(chroma_mean, minor_profile)[0, 1]
        is_minor = minor_corr > major_corr
        note_names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
        key = f"{note_names[key_idx]} {'minor' if is_minor else 'major'}"
        return {'bpm': round(bpm, 1), 'key': key}
    except Exception as e:
        print(f"Audio analysis error: {e}")
        return {'bpm': None, 'key': None}


def process_job(job_id, session_id, file_path, filename, original_name):
    """Background job: separa audio con Demucs e aggiorna il progresso."""
    from demucs.api import Separator, save_audio

    def set_progress(progress, message=None):
        with JOBS_LOCK:
            JOBS[job_id]['progress'] = progress
            if message:
                JOBS[job_id]['message'] = message

    def callback(info):
        audio_length = info.get('audio_length', 0)
        segment_offset = info.get('segment_offset')
        shift_idx = info.get('shift_idx', 0)
        model_idx = info.get('model_idx_in_bag', 0)
        models = info.get('models', 1)
        state = info.get('state')

        if audio_length > 0 and segment_offset is not None:
            # Progresso basato sulla posizione del segmento corrente
            shift_progress = (shift_idx + segment_offset / audio_length)
            progress = (model_idx + shift_progress / 1) / models * 100
            set_progress(min(int(progress), 95))
        elif state == 'end':
            set_progress(95)

    try:
        set_progress(0, 'Loading model...')

        # Primo tentativo: device automatico (MPS su Apple Silicon)
        try:
            separator = Separator(model='htdemucs', progress=False, callback=callback)
        except Exception as e:
            if 'MTLCompilerService' in str(e) or 'Failed to created pipeline state object' in str(e):
                print(f"MPS non disponibile, uso CPU: {e}")
                separator = Separator(model='htdemucs', device='cpu', progress=False, callback=callback)
            else:
                raise

        set_progress(2, 'Separating audio...')
        origin, separated = separator.separate_audio_file(file_path)

        set_progress(88, 'Analyzing audio...')
        # Analisi BPM e chiave sul file originale prima di eliminarlo
        analysis = analyze_audio(file_path)
        os.remove(file_path)

        # Costruisce il suffisso per il filename: "SongName-120bpm-Emajor"
        bpm_str = f"{analysis['bpm']:.0f}bpm" if analysis.get('bpm') else ''
        key_str = analysis.get('key', '').replace(' ', '').replace('#', 's') if analysis.get('key') else ''
        suffix = '-'.join(filter(None, [bpm_str, key_str]))
        name_suffix = f"-{suffix}" if suffix else ''

        set_progress(92, 'Encoding stems...')
        # Salva gli stem come MP3
        session_folder = UPLOAD_FOLDER / session_id
        stems = {}
        for stem_name, wav in separated.items():
            label = STEM_LABELS.get(stem_name, stem_name)
            new_filename = f"{original_name}{name_suffix}-{label}.mp3"
            new_file_path = session_folder / new_filename
            save_audio(wav, str(new_file_path), separator.samplerate, bitrate=320, preset=2)
            stems[label] = f'/download/{session_id}/{new_filename}'

        # Salva i metadati della sessione per la library
        import json
        meta = {
            'track_name': original_name,
            'bpm': analysis.get('bpm'),
            'key': analysis.get('key'),
            'created_at': time.strftime('%Y-%m-%dT%H:%M:%S'),
            'stems': stems,
        }
        with open(session_folder / 'meta.json', 'w') as f:
            json.dump(meta, f)

        with JOBS_LOCK:
            JOBS[job_id]['state'] = 'done'
            JOBS[job_id]['progress'] = 100
            JOBS[job_id]['stems'] = stems
            JOBS[job_id]['analysis'] = analysis
            JOBS[job_id]['session_id'] = session_id

        print(f"Job {job_id} complete. Stems: {stems}")

    except Exception as e:
        print(f"Job {job_id} error: {e}")
        import traceback
        traceback.print_exc()
        session_folder = UPLOAD_FOLDER / session_id
        if session_folder.exists():
            shutil.rmtree(session_folder)
        with JOBS_LOCK:
            JOBS[job_id]['state'] = 'error'
            JOBS[job_id]['error'] = str(e)


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
        original_name = Path(filename).stem
        file_path = session_folder / filename
        file.save(str(file_path))
        print(f"File saved to {file_path}")

        # Crea job e avvia in background
        job_id = str(uuid.uuid4())
        with JOBS_LOCK:
            JOBS[job_id] = {
                'state': 'processing',
                'progress': 0,
                'message': 'Starting...',
                'stems': None,
                'analysis': None,
                'session_id': None,
                'error': None,
            }

        thread = threading.Thread(
            target=process_job,
            args=(job_id, session_id, file_path, filename, original_name),
            daemon=True
        )
        thread.start()

        return jsonify({'job_id': job_id}), 202

    except Exception as e:
        print(f"Error in process_audio: {str(e)}")
        import traceback
        traceback.print_exc()
        if 'session_folder' in locals() and session_folder.exists():
            shutil.rmtree(session_folder)
        return jsonify({'error': str(e)}), 500

@app.route('/status/<job_id>', methods=['GET'])
def job_status(job_id):
    with JOBS_LOCK:
        job = JOBS.get(job_id)
    if not job:
        return jsonify({'error': 'Job not found'}), 404

    response = {
        'state': job['state'],
        'progress': job['progress'],
        'message': job.get('message', ''),
    }
    if job['state'] == 'done':
        response['stems'] = job['stems']
        response['analysis'] = job['analysis']
        response['session_id'] = job['session_id']
    elif job['state'] == 'error':
        response['error'] = job['error']
    return jsonify(response)

@app.route('/cleanup/<session_id>', methods=['DELETE'])
def cleanup_session(session_id):
    try:
        session_folder = UPLOAD_FOLDER / session_id
        if session_folder.exists():
            shutil.rmtree(session_folder)
            return jsonify({'message': 'Session cleaned up successfully'}), 200
        else:
            return jsonify({'error': 'Session not found'}), 404
    except Exception as e:
        print(f"Error cleaning up session: {str(e)}")
        return jsonify({'error': 'Cleanup failed'}), 500

@app.route('/library', methods=['GET'])
def get_library():
    """Lista delle sessioni di separazione salvate (le piu' recenti prima)."""
    import json
    items = []
    try:
        for session_folder in UPLOAD_FOLDER.iterdir():
            meta_file = session_folder / 'meta.json'
            if not session_folder.is_dir() or not meta_file.exists():
                continue
            try:
                with open(meta_file) as f:
                    meta = json.load(f)
                # Verifica che i file stem esistano ancora
                if not all((session_folder / Path(url).name).exists() for url in meta.get('stems', {}).values()):
                    continue
                items.append({
                    'session_id': session_folder.name,
                    'track_name': meta.get('track_name', 'Unknown'),
                    'bpm': meta.get('bpm'),
                    'key': meta.get('key'),
                    'created_at': meta.get('created_at'),
                    'stems': meta.get('stems', {}),
                })
            except Exception as e:
                print(f"Error reading meta for {session_folder.name}: {e}")
        items.sort(key=lambda x: x.get('created_at') or '', reverse=True)
        return jsonify({'library': items})
    except Exception as e:
        print(f"Error listing library: {str(e)}")
        return jsonify({'error': 'Library listing failed'}), 500

@app.route('/library', methods=['DELETE'])
def clear_library():
    """Cancella tutte le sessioni salvate."""
    try:
        for session_folder in UPLOAD_FOLDER.iterdir():
            if session_folder.is_dir():
                shutil.rmtree(session_folder)
        return jsonify({'message': 'Library cleared'}), 200
    except Exception as e:
        print(f"Error clearing library: {str(e)}")
        return jsonify({'error': 'Library clear failed'}), 500

@app.route('/download/<session_id>/<filename>')
def download_file(session_id, filename):
    try:
        session_folder = UPLOAD_FOLDER / session_id
        file_path = session_folder / filename

        if not file_path.exists():
            return jsonify({'error': 'File not found'}), 404

        return send_file(
            str(file_path),
            as_attachment=True,
            mimetype='audio/mpeg',
            download_name=filename
        )
    except Exception as e:
        print(f"Error downloading file: {str(e)}")
        return jsonify({'error': 'Download failed'}), 500

@app.route('/download-all/<session_id>')
def download_all_stems(session_id):
    """Scarica tutti gli stem di una sessione come archivio ZIP."""
    try:
        session_folder = UPLOAD_FOLDER / session_id
        if not session_folder.exists():
            return jsonify({'error': 'Session not found'}), 404

        mp3_files = list(session_folder.glob('*.mp3'))
        if not mp3_files:
            return jsonify({'error': 'No stems found'}), 404

        # Estrae il nome della canzone dal primo file: "SongName-83bpm-Emajor-vocals.mp3" -> "SongName-83bpm-Emajor"
        first_name = mp3_files[0].stem
        # Rimuove il suffisso dello stem (ultima parte dopo l'ultimo '-')
        parts = first_name.rsplit('-', 1)
        song_name = parts[0] if len(parts) > 1 else first_name

        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
            for mp3 in mp3_files:
                zf.write(mp3, mp3.name)

        zip_buffer.seek(0)
        return send_file(
            zip_buffer,
            as_attachment=True,
            mimetype='application/zip',
            download_name=f'{song_name}-stems.zip'
        )
    except Exception as e:
        print(f"Error creating zip: {str(e)}")
        return jsonify({'error': 'Zip creation failed'}), 500

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
    app.run(debug=True, host='0.0.0.0', port=5001)
