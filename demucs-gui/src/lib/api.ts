// Definiamo le interfacce per i tipi
interface StemResponse {
  stems: {
    vocals: string;
    drums: string;
    bass: string;
    other: string;
  }
}

interface ProcessedStems {
  vocals: string;
  drums: string;
  bass: string;
  other: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'https://5000-01jcm8y85taewnh1dh4tmyywmd.cloudspaces.litng.ai';

export async function uploadAudio(file: File): Promise<ProcessedStems> {
  // Validazione iniziale del file
  if (!file) {
    throw new Error('No file provided');
  }

  if (!file.type.includes('audio')) {
    throw new Error('Invalid file type. Please upload an audio file.');
  }

  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch(`${API_URL}/process`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      // Gestione più dettagliata degli errori HTTP
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

    const data = await response.json() as StemResponse;

    // Validazione della risposta
    if (!data.stems) {
      throw new Error('Invalid server response');
    }

    return {
      vocals: data.stems.vocals || '',
      drums: data.stems.drums || '',
      bass: data.stems.bass || '',
      other: data.stems.other || ''
    };

  } catch (error) {
    console.error('API Error:', error);
    
    // Gestione più specifica degli errori di rete
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Unable to connect to the server. Please check your internet connection.');
    }
    
    // Rilancia l'errore se è già un'istanza di Error
    if (error instanceof Error) {
      throw error;
    }

    // Fallback generico per altri tipi di errori
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