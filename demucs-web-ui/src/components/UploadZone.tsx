import { useCallback, useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  isUploading: boolean;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onFileSelect, isUploading }) => {
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const files = Array.from(e.dataTransfer?.files || []);
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('audio/')) {
        onFileSelect(file);
      } else {
        alert('Please upload an audio file');
      }
    }
  }, [onFileSelect]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target?.files || []);
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('audio/')) {
        onFileSelect(file);
      } else {
        alert('Please upload an audio file');
      }
    }
  }, [onFileSelect]);

  return (
    <div
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={`
        relative rounded-xl border-2 border-dashed p-8 cursor-pointer
        ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
        transition-all duration-200 ease-in-out
        hover:border-blue-500 hover:bg-blue-50
      `}
    >
      <input
        type="file"
        onChange={handleChange}
        accept="audio/*"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className={`
          rounded-full p-4
          ${isDragActive ? 'bg-blue-100' : 'bg-gray-100'}
        `}>
          {isUploading ? (
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          ) : (
            <Upload className="h-8 w-8 text-blue-600" />
          )}
        </div>
        
        <div className="text-center">
          <p className="text-lg font-medium text-gray-700">
            {isUploading ? 'Processing...' : 'Drop your audio file here'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {isUploading 
              ? 'Please wait while we process your audio file'
              : 'or click to select a file (MP3, WAV, M4A, AAC)'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default UploadZone;