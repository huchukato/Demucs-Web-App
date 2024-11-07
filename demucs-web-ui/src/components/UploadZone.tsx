import React, { useCallback } from 'react';
import { Upload, Music2, Video } from 'lucide-react';

interface Props {
  onFileSelect: (file: File) => void;
  isUploading: boolean;
}

export function UploadZone({ onFileSelect, isUploading }: Props) {
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.type.startsWith('audio/') || file.type.startsWith('video/'))) {
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  }, [onFileSelect]);

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className="relative group"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity" />
      <div className="relative w-full max-w-3xl mx-auto p-8 border-2 border-dashed border-blue-300 rounded-2xl hover:border-blue-500 transition-colors cursor-pointer bg-white/50 backdrop-blur-sm">
        <label className="flex flex-col items-center justify-center space-y-6 cursor-pointer">
          <div className="relative">
            <div className="absolute -inset-4 bg-blue-500/20 rounded-full blur-xl animate-pulse" />
            <div className="relative bg-gradient-to-r from-blue-500 to-purple-500 rounded-full p-4">
              <Upload className="w-10 h-10 text-white" />
            </div>
          </div>

          <div className="text-center space-y-2">
            <p className="text-xl font-medium text-gray-700">
              {isUploading ? 'Uploading...' : 'Drop your audio or video file here'}
            </p>
            <p className="text-gray-500">or click to select</p>
          </div>

          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <Music2 className="w-4 h-4" />
              <span>Audio files</span>
            </div>
            <div className="flex items-center space-x-1">
              <Video className="w-4 h-4" />
              <span>Video files</span>
            </div>
          </div>

          <input
            type="file"
            className="hidden"
            accept="audio/*,video/*"
            onChange={handleFileInput}
            disabled={isUploading}
          />
        </label>
      </div>
    </div>
  );
}