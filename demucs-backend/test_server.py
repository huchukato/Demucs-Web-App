import requests
import os

# Get the current working directory (assuming it's the backend folder)
current_dir = os.getcwd()

# Construct the path to the audio file
audio_file_path = os.path.join(current_dir, 'src', 'thunder.mp3')

# Ensure the file exists
if not os.path.exists(audio_file_path):
    print(f"Error: File not found at {audio_file_path}")
    exit(1)

url = 'http://127.0.0.1:5000/process'
files = {'file': open(audio_file_path, 'rb')}

try:
    response = requests.post(url, files=files)
    response.raise_for_status()  # Raises an HTTPError if the HTTP request returned an unsuccessful status code
    print("Response:", response.json())
except requests.exceptions.RequestException as e:
    print(f"An error occurred: {e}")
finally:
    files['file'].close()  # Make sure to close the file
