export interface Track {
  id: string;
  name: string;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  file?: File;
  result?: {
    vocals?: string;
    drums?: string;
    bass?: string;
    other?: string;
  };
  error?: string;
}

export interface UploadResponse {
  id: string;
  name: string;
}