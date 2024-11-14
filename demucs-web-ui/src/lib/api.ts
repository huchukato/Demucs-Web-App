const API_URL = 'https://5000-01jcm8y85taewnh1dh4tmyywmd.cloudspaces.litng.ai';

export async function uploadAudio(file: File) {
  const formData = new FormData();
  formData.append('file', file);  // Assicurati che il campo sia 'file' come nel backend

  const response = await fetch(`${API_URL}/process`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    throw new Error('Failed to process audio');
  }

  return await response.json();
}
