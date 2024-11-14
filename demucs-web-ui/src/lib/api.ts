const API_URL = 'http://localhost:5000';

export async function uploadAudio(file: File) {
  const formData = new FormData();
  formData.append('audio', file);

  const response = await fetch(`${API_URL}/separate`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    throw new Error('Failed to process audio');
  }

  return await response.json();
}