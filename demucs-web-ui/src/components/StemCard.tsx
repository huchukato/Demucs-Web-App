import React from 'react';
import { Download, Waves } from 'lucide-react';

interface StemCardProps {
  name: string;
  url: string;
  color: string;
}

export function StemCard({ name, url, color }: StemCardProps) {
  const handleDownload = () => {
    window.open(url, '_blank');
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6 hover:shadow-lg hover:shadow-pink-500/10 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full ${color} mr-3`}></div>
          <h3 className="text-xl font-semibold">{name}</h3>
        </div>
        <button 
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors duration-200"
          onClick={handleDownload}
          title={`Download ${name} stem`}
        >
          <Download className="w-5 h-5" />
        </button>
      </div>
      
      <div className="bg-gray-700 rounded-lg p-4 h-24 flex items-center justify-center">
        <Waves className="w-full h-12 text-gray-500" />
      </div>
      
      <div className="mt-4">
        <audio 
          controls 
          className="w-full"
          src={url}
        >
          Your browser does not support the audio element.
        </audio>
      </div>
    </div>
  );
}