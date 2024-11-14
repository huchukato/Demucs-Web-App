import React, { useState } from 'react';
import { Header } from './components/Header';
import { FileUpload } from './components/FileUpload';
import { StemCard } from './components/StemCard';
import { uploadAudio } from './lib/api';

interface Stem {
  name: string;
  url: string;
  color: string;
}

export default function App() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [stems, setStems] = useState<Stem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      setError(null);
      
      const result = await uploadAudio(file);
      
      setStems([
        { name: 'Vocals', url: result.vocals, color: 'bg-pink-500' },
        { name: 'Drums', url: result.drums, color: 'bg-purple-500' },
        { name: 'Bass', url: result.bass, color: 'bg-blue-500' },
        { name: 'Other', url: result.other, color: 'bg-green-500' }
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process audio');
      setStems([]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-8">
        <Header />
        <FileUpload isProcessing={isProcessing} onFileUpload={handleFileUpload} />
        
        {error && (
          <div className="max-w-4xl mx-auto mb-8 p-4 bg-red-500/20 border border-red-500 rounded-lg text-center">
            {error}
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mt-8">
          {stems.map((stem) => (
            <StemCard key={stem.name} {...stem} />
          ))}
        </div>
      </div>
    </div>
  );
}