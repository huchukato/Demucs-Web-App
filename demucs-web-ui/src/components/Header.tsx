import React from 'react';
import { Music2 } from 'lucide-react';

export function Header() {
  return (
    <div className="flex items-center justify-center mb-12">
      <Music2 className="w-10 h-10 text-pink-500 mr-4" />
      <h1 className="text-4xl font-bold">Stem Separator</h1>
    </div>
  );
}