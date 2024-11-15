import React from 'react';
import { Music2 } from 'lucide-react';

export function Header() {
  return (
    <div className="flex items-center justify-center mb-12">
      <div className="bg-pink-500/10 p-3 rounded-xl mr-4">
        <Music2 className="w-8 h-8 text-pink-500" />
      </div>
      <div>
        <h1 className="text-4xl font-bold">Demucs Web App</h1>
        <p className="text-gray-400 text-sm">AI-Powered Music Source Separation</p>
      </div>
    </div>
  );
}