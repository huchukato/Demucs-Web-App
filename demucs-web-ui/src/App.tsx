import { useState, useCallback } from 'react';
import { Music4, Mic, Drum, Guitar, Radio } from 'lucide-react';
import { UploadZone } from './components/UploadZone';
import { TrackList } from './components/TrackList';
import type { Track } from './types';

function App() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = useCallback(async (file: File) => {
    setIsUploading(true);

    // Crea una nuova richiesta HTTP per inviare il file audio al backend
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('https://5000-01jc2hgbfh9harp7vdddrbt76a.cloudspaces.litng.ai/process', {
        method: 'POST',
        body: formData,
      });

      // Verifica se la risposta è stata ricevuta correttamente
      if (response.ok) {
        const data = await response.json();
        // Aggiorna lo stato con i risultati della separazione audio
        setTracks((prevTracks) => [...prevTracks, data]);
      } else {
        console.error('Errore durante la richiesta:', response.status);
      }
    } catch (error) {
      console.error('Errore durante la richiesta:', error);
    } finally {
      setIsUploading(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-3xl" />

        <div className="relative container mx-auto px-4 py-16">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div className="bg-blue-600 rounded-2xl p-3 shadow-lg shadow-blue-500/20">
                <Music4 className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Demucs Web
              </h1>
            </div>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              Separate your music into individual stems using advanced AI technology
            </p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-12">
              {[
                { icon: <Mic className="w-6 h-6" />, label: 'Vocals' },
                { icon: <Drum className="w-6 h-6" />, label: 'Drums' },
                { icon: <Guitar className="w-6 h-6" />, label: 'Bass' },
                { icon: <Radio className="w-6 h-6" />, label: 'Other' }
              ].map((item, index) => (
                <div key={index} className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg shadow-blue-500/5 hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-1">
                  <div className="flex flex-col items-center space-y-2">
                    <div className="text-blue-600">
                      {item.icon}
                    </div>
                    <span className="font-medium text-gray-800">{item.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-12">
            <UploadZone
              onFileSelect={handleFileSelect}
              isUploading={isUploading}
            />

            <TrackList tracks={tracks} />
          </div>
        </div>
      </div>

      <footer className="container mx-auto px-4 py-8 text-center text-gray-600">
        <p className="text-sm">
          Powered by advanced AI technology. Process your audio with confidence.
        </p>
      </footer>
    </div>
  );
}

export default App;
