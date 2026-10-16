// Definiamo le interfacce per i tipi
interface StemResponse {
  stems: {
    vocals: string;
    drums: string;
    bass: string;
    instrumental: string;
  }
  analysis: {
    bpm: number | null;
    key: string | null;
  };
  session_id: string;
}

interface ProcessedStems {
  vocals: string;
  drums: string;
  bass: string;
  instrumental: string;
  session_id: string;
  analysis: {
    bpm: number | null;
    key: string | null;
  };
}

interface JobStatus {
  state: 'processing' | 'done' | 'error';
  progress: number;
  message: string;
  stems?: Record<string, string>;
  analysis?: { bpm: number | null; key: string | null };
  session_id?: string;
  error?: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export async function uploadAudio(file: File, onProgress?: (progress: number, message: string) => void): Promise<ProcessedStems> {
  // Validazione iniziale del file (il formato lo valida già FileUpload)
  if (!file) {
    throw new Error('No file provided');
  }

  const formData = new FormData();
  formData.append('file', file);

  try {
    // Step 1: avvia il job
    const response = await fetch(`${API_URL}/process`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      switch (response.status) {
        case 413:
          throw new Error('File too large. Please upload a smaller file.');
        case 415:
          throw new Error('Unsupported file type.');
        case 429:
          throw new Error('Too many requests. Please try again later.');
        default:
          const error = await response.json();
          throw new Error(error.error || `Server error: ${response.status}`);
      }
    }

    const data = await response.json() as { job_id: string };
    const jobId = data.job_id;

    // Step 2: polla lo stato del job
    return new Promise<ProcessedStems>((resolve, reject) => {
      const poll = async () => {
        try {
          const statusResp = await fetch(`${API_URL}/status/${jobId}`);
          if (!statusResp.ok) {
            reject(new Error(`Status check failed: ${statusResp.status}`));
            return;
          }

          const status = await statusResp.json() as JobStatus;

          if (onProgress) {
            onProgress(status.progress, status.message || '');
          }

          if (status.state === 'done' && status.stems && status.session_id) {
            resolve({
              vocals: status.stems.vocals || '',
              drums: status.stems.drums || '',
              bass: status.stems.bass || '',
              instrumental: status.stems.instrumental || '',
              session_id: status.session_id,
              analysis: status.analysis || { bpm: null, key: null }
            });
          } else if (status.state === 'error') {
            reject(new Error(status.error || 'Processing failed'));
          } else {
            // Continua a pollare ogni 500ms
            setTimeout(poll, 500);
          }
        } catch (err) {
          reject(err instanceof Error ? err : new Error('Status poll failed'));
        }
      };
      setTimeout(poll, 500);
    });

  } catch (error) {
    console.error('API Error:', error);

    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Unable to connect to the server. Please check your internet connection.');
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error('An unexpected error occurred. Please try again later.');
  }
}

// Opzionale: aggiungi una funzione di utility per verificare lo stato del server
export async function checkServerStatus(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

// Funzione per cancellare una sessione precedente
export async function cleanupSession(sessionId: string): Promise<void> {
  try {
    await fetch(`${API_URL}/cleanup/${sessionId}`, {
      method: 'DELETE'
    });
  } catch (error) {
    console.warn('Failed to cleanup session:', error);
    // Non lanciamo errore, è solo cleanup
  }
}

export interface LibraryItem {
  session_id: string;
  track_name: string;
  bpm: number | null;
  key: string | null;
  created_at: string | null;
  stems: Record<string, string>;
}

export async function getLibrary(): Promise<LibraryItem[]> {
  try {
    const response = await fetch(`${API_URL}/library`);
    if (!response.ok) return [];
    const data = await response.json() as { library: LibraryItem[] };
    return data.library || [];
  } catch (error) {
    console.warn('Failed to load library:', error);
    return [];
  }
}

export async function clearLibrary(): Promise<void> {
  try {
    await fetch(`${API_URL}/library`, { method: 'DELETE' });
  } catch (error) {
    console.warn('Failed to clear library:', error);
  }
}

// Download interno: fetch + Blob (window.open in Electron apre un popup bianco)
export async function downloadFile(url: string, filename: string): Promise<void> {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Download failed: ${res.status}`);
    const blob = await res.blob();
    const objUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(objUrl), 5000);
  } catch (error) {
    console.error('Download error:', error);
    throw error instanceof Error ? error : new Error('Download failed');
  }
}
