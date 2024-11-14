import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Loader2 } from 'lucide-react';

interface FileUploadProps {
  isProcessing: boolean;
  onFileUpload: (file: File) => void;
}

export function FileUpload({ isProcessing, onFileUpload }: FileUploadProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileUpload(acceptedFiles[0]);
    }
  }, [onFileUpload]);

  const { getRootProps, getInputProps } = useDropzone({ onDrop, accept: { 'audio/*': [] } });

  return (
    <div className="max-w-xl mx-auto mb-12">
      <div 
        {...getRootProps({
          className: `
            flex flex-col items-center justify-center w-full h-48 
            border-2 border-dashed rounded-xl 
            ${isProcessing ? 'border-gray-600 bg-gray-800/50' : 'border-pink-500 hover:bg-gray-800/50 cursor-pointer'}
            transition-all duration-300
          `
        })}
      >
        <input {...getInputProps()} disabled={isProcessing} />
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          {isProcessing ? (
            <>
              <Loader2 className="w-12 h-12 text-pink-500 animate-spin mb-4" />
              <p className="text-xl">Separating stems...</p>
              <p className="text-sm text-gray-400 mt-2">This may take a few minutes</p>
            </>
          ) : (
            <>
              <Upload className="w-12 h-12 text-pink-500 mb-4" />
              <p className="text-xl mb-2">Drop your audio file here</p>
              <p className="text-sm text-gray-400">MP3, WAV up to 10MB</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
