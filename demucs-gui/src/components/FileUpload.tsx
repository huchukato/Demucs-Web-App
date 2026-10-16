import React, { useCallback } from 'react';
import { Upload, Music4 } from 'lucide-react';

interface FileUploadProps {
  isProcessing: boolean;
  onFileUpload: (file: File) => void;
  progress: number;
  progressMessage: string;
  hasResult: boolean;
}

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB in bytes

const ACCEPTED_EXTENSIONS = ['mp3', 'wav', 'flac', 'ogg', 'oga', 'm4a', 'aac', 'aiff', 'aif', 'opus'];

function isAccepted(file: File): boolean {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  return ACCEPTED_EXTENSIONS.includes(ext) || file.type.startsWith('audio/');
}

export function FileUpload({ isProcessing, onFileUpload, progress, progressMessage, hasResult }: FileUploadProps) {
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (isProcessing) return;

      const file = Array.from(e.dataTransfer.files)[0];
      if (!file) return;

      if (!isAccepted(file)) {
        alert('Unsupported file format. Supported: MP3, WAV, FLAC, OGG, M4A, AAC, AIFF, OPUS');
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        alert('File too large. Maximum size is 100MB.');
        return;
      }
      onFileUpload(file);
    },
    [isProcessing, onFileUpload]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!isAccepted(file)) {
        alert('Unsupported file format. Supported: MP3, WAV, FLAC, OGG, M4A, AAC, AIFF, OPUS');
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        alert('File too large. Maximum size is 100MB.');
        return;
      }
      onFileUpload(file);
    },
    [onFileUpload]
  );

  // Compact variant when results are already shown
  if (hasResult && !isProcessing) {
    return (
      <div className="mt-3">
        <input
          id="file-upload-compact"
          type="file"
          className="hidden"
          accept={ACCEPTED_EXTENSIONS.map(e => `.${e}`).join(',')}
          onChange={handleFileSelect}
        />
        <button
          onClick={() => document.getElementById('file-upload-compact')?.click()}
          className="w-full border border-dashed border-neutral-800 hover:border-neutral-600 rounded-lg py-3 flex items-center justify-center gap-2 text-sm text-neutral-500 hover:text-neutral-300 transition-colors duration-150"
        >
          <Upload className="w-4 h-4" />
          Drop another track here or click to browse
        </button>
      </div>
    );
  }

  return (
    <div>
      <div
        className={`
          flex flex-col items-center justify-center w-full h-56
          border border-dashed rounded-lg backdrop-blur-md
          ${isProcessing ? 'border-neutral-800 bg-neutral-900/40' : 'border-neutral-600 bg-neutral-900/30 hover:border-neutral-400 hover:bg-neutral-900/50 cursor-pointer'}
          transition-colors duration-150
        `}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center px-6">
          {isProcessing ? (
            <>
              <Music4 className="w-8 h-8 text-pink-500 animate-pulse mb-4" />
              <p className="text-base font-medium mb-1">Processing your track</p>
              <p className="text-sm text-neutral-500 mb-5">{progressMessage || 'This may take a few minutes'}</p>

              <div className="w-72 max-w-full">
                <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-pink-500 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-center mt-2 text-xs font-medium text-neutral-400 tabular-nums">
                  {progress}%
                </p>
              </div>
            </>
          ) : (
            <>
              <input
                id="file-upload"
                type="file"
                className="hidden"
                accept={ACCEPTED_EXTENSIONS.map(e => `.${e}`).join(',')}
                onChange={handleFileSelect}
                disabled={isProcessing}
              />
              <div
                className="bg-neutral-900 border border-neutral-800 p-3.5 rounded-lg mb-4 cursor-pointer"
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <Upload className="w-6 h-6 text-neutral-300" />
              </div>
              <p className="text-base font-medium mb-1">Drop your track here</p>
              <p className="text-sm text-neutral-500">MP3, WAV, FLAC, OGG, M4A, AAC, AIFF, OPUS — up to 100MB</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
