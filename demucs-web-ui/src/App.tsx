import { useState } from 'react';
import { Header } from './components/Header';
import { FileUpload } from './components/FileUpload';
import { StemCard } from './components/StemCard';
import { uploadAudio, buildStemUrl } from './lib/api';

interface Stem {
  name: string;
  url: string;
  color: string;
}

interface ProcessingResult {
  message: string;
  stems: {
    [key: string]: string;
  };
}

const STEM_COLORS = {
  vocals: 'bg-pink-500',
  drums: 'bg-purple-500',
  bass: 'bg-blue-500',
  other: 'bg-green-500'
};

export default function App() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [stems, setStems] = useState<Stem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (file: File) => {
    try {
      setIsProcessing(true);
      setError(null);
      setStems([]);
      
      const result = await uploadAudio(file) as ProcessingResult;
      
      // Trasforma i percorsi degli stems in oggetti Stem con URL completi
      const stemObjects = Object.entries(result.stems).map(([name, path]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        url: buildStemUrl(path), // Costruisce l'URL completo
        color: STEM_COLORS[name as keyof typeof STEM_COLORS] || 'bg-gray-500'
      }));
      
      setStems(stemObjects);
    } catch (err) {   
      setError(err instanceof Error ? err.message : 'Failed to process audio');
      setStems([]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async (url: string, stemName: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${stemName}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('Download error:', err);
      setError(`Failed to download ${stemName}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-8">
        <Header />
        <FileUpload 
          isProcessing={isProcessing} 
          onFileUpload={handleFileUpload} 
        />
        
        {error && (
          <div className="max-w-4xl mx-auto mb-8 p-4 bg-red-500/20 border border-red-500 rounded-lg text-center">
            {error}
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mt-8">
          {stems.map((stem) => (
            <StemCard 
              key={stem.name} 
              {...stem} 
              onDownload={() => handleDownload(stem.url, stem.name)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}