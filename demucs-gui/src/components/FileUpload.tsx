import React, { useCallback } from 'react';
import { Upload, Loader2, Music4 } from 'lucide-react';

interface FileUploadProps {
  isProcessing: boolean;
  onFileUpload: (file: File) => void;
}

export function FileUpload({ isProcessing, onFileUpload }: FileUploadProps) {
  const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB in bytes

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (isProcessing) return;

      const files = Array.from(e.dataTransfer.files);
      const mp3File = files.find(file => file.type === 'audio/mpeg');

      if (mp3File && mp3File.size <= MAX_FILE_SIZE) { // 20MB limit
        onFileUpload(mp3File);
      } else {
        alert('Please upload an MP3 file under 20MB');
      }
    },
    [isProcessing, onFileUpload]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && file.size <= MAX_FILE_SIZE) { // 20MB limit
        onFileUpload(file);
      } else {
        alert('Please upload an MP3 file under 20MB');
      }
    },
    [onFileUpload]
  );

  return (
    <div className="max-w-xl mx-auto mb-12">
      <label 
        className={`
          flex flex-col items-center justify-center w-full h-64
          border-2 border-dashed rounded-xl 
          ${isProcessing ? 'border-gray-600 bg-gray-800/50' : 'border-pink-500 hover:bg-gray-800/50 cursor-pointer'}
          transition-all duration-300 backdrop-blur-sm
        `}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          {isProcessing ? (
            <>
              <div className="relative">
                <Loader2 className="w-16 h-16 text-pink-500 animate-spin mb-4" />
                <Music4 className="w-8 h-8 text-pink-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="text-2xl font-semibold mb-2">Processing your track</p>
              <p className="text-sm text-gray-400">This may take a few minutes</p>
            </>
          ) : (
            <>
              <div className="bg-pink-500/10 p-4 rounded-xl mb-4">
                <Upload className="w-12 h-12 text-pink-500" />
              </div>
              <p className="text-2xl font-semibold mb-2">Drop your track here</p>
              <p className="text-sm text-gray-400 mb-2">MP3 files up to 20MB</p>
              <button 
                className="px-4 py-2 bg-pink-500 rounded-lg text-sm font-medium hover:bg-pink-600 transition-colors"
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                Select File
              </button>
            </>
          )}
        </div>
        <input 
          id="file-upload"
          type="file" 
          className="hidden" 
          accept="audio/mpeg"
          onChange={handleFileSelect}
          disabled={isProcessing}
        />
      </label>
    </div>
  );
}