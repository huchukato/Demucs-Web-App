import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { FileUpload } from './components/FileUpload';
import { StemCard } from './components/StemCard';
import { Library } from './components/Library';
import { uploadAudio, checkServerStatus, cleanupSession, getLibrary, clearLibrary } from './lib/api';
import type { LibraryItem } from './lib/api';
import { Download, Music2, Gauge, FileMusic } from 'lucide-react';

interface Stem {
  name: string;
  url: string;
  color: string;
  waveColor: string;
}

const STEM_COLORS: Record<string, { color: string; waveColor: string }> = {
  Vocals: { color: 'bg-pink-500', waveColor: '#ec4899' },
  Drums: { color: 'bg-purple-500', waveColor: '#a855f7' },
  Bass: { color: 'bg-blue-500', waveColor: '#3b82f6' },
  Instrumental: { color: 'bg-green-500', waveColor: '#10b981' },
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export default function App() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [stems, setStems] = useState<Stem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<{ bpm: number | null; key: string | null } | null>(null);
  const [trackName, setTrackName] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [serverUp, setServerUp] = useState(true);
  const [library, setLibrary] = useState<LibraryItem[]>([]);

  const refreshLibrary = async () => {
    setLibrary(await getLibrary());
  };

  useEffect(() => {
    const checkServer = async () => {
      const isServerUp = await checkServerStatus();
      setServerUp(isServerUp);
      if (!isServerUp) {
        setError('Server is currently unavailable. Please try again later.');
      }
    };
    checkServer();
    refreshLibrary();
  }, []);

  const handleFileUpload = async (file: File) => {
    try {
      setIsProcessing(true);
      setError(null);
      setProgress(0);
      setProgressMessage('');
      setTrackName(file.name.replace(/\.[^.]+$/, ''));

      const result = await uploadAudio(file, (pct, msg) => {
        setProgress(pct);
        setProgressMessage(msg);
      });

      setCurrentSessionId(result.session_id);
      setAnalysis(result.analysis);

      setStems([
        { name: 'Vocals', url: result.vocals, ...STEM_COLORS.Vocals },
        { name: 'Drums', url: result.drums, ...STEM_COLORS.Drums },
        { name: 'Bass', url: result.bass, ...STEM_COLORS.Bass },
        { name: 'Instrumental', url: result.instrumental, ...STEM_COLORS.Instrumental },
      ]);
      refreshLibrary();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process audio');
      setStems([]);
      setAnalysis(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadAll = () => {
    if (currentSessionId) {
      window.open(`${API_URL}/download-all/${currentSessionId}`, '_blank');
    }
  };

  const handleReset = () => {
    setStems([]);
    setAnalysis(null);
    setTrackName('');
    setCurrentSessionId(null);
  };

  const handleOpenSession = (item: LibraryItem) => {
    setCurrentSessionId(item.session_id);
    setTrackName(item.track_name);
    setAnalysis({ bpm: item.bpm, key: item.key });
    const s = item.stems;
    setStems([
      { name: 'Vocals', url: s.vocals || '', ...STEM_COLORS.Vocals },
      { name: 'Drums', url: s.drums || '', ...STEM_COLORS.Drums },
      { name: 'Bass', url: s.bass || '', ...STEM_COLORS.Bass },
      { name: 'Instrumental', url: s.instrumental || '', ...STEM_COLORS.Instrumental },
    ]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteSession = async (sessionId: string) => {
    await cleanupSession(sessionId);
    if (currentSessionId === sessionId) {
      handleReset();
    }
    refreshLibrary();
  };

  const handleClearAll = async () => {
    await clearLibrary();
    handleReset();
    refreshLibrary();
  };

  const hasResults = stems.length > 0;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 relative">
      {/* Background image */}
      <div
        className="fixed inset-0 bg-cover bg-center pointer-events-none"
        style={{ backgroundImage: "url('/background.jpg')" }}
      />
      {/* Dark overlay for readability when content is shown */}
      {(hasResults || isProcessing) && (
        <div className="fixed inset-0 bg-neutral-950/80 pointer-events-none" />
      )}

      <div className="relative container mx-auto px-8 py-6 max-w-2xl">
        {(hasResults || isProcessing) && <Header serverUp={serverUp} />}

        {/* Initial view: dropzone pinned to the bottom, below the logo in the background image */}
        {!hasResults && !isProcessing && (
          <div className="flex flex-col min-h-[calc(100vh-3rem)]">
            <div className="flex-1" />
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-center text-red-300 text-sm">
                {error}
              </div>
            )}
            <FileUpload
              isProcessing={isProcessing}
              onFileUpload={handleFileUpload}
              progress={progress}
              progressMessage={progressMessage}
              hasResult={false}
            />
            <div className="h-10" />
          </div>
        )}

        {/* Processing / results view */}
        {(hasResults || isProcessing) && (
          <>
            {isProcessing && (
              <div className="mt-16">
                <FileUpload
                  isProcessing={isProcessing}
                  onFileUpload={handleFileUpload}
                  progress={progress}
                  progressMessage={progressMessage}
                  hasResult={false}
                />
              </div>
            )}

            {error && (
              <div className="mt-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-center text-red-300 text-sm">
                {error}
              </div>
            )}

            {hasResults && (
              <>
                {/* Song info bar */}
                <div className="mt-6 bg-neutral-900/90 border border-neutral-800 rounded-lg p-4 flex flex-wrap items-center gap-x-5 gap-y-3">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <FileMusic className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                    <span className="font-medium text-sm truncate">{trackName}</span>
                  </div>
                  {analysis?.bpm && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-neutral-500">BPM</span>
                      <span className="font-medium tabular-nums">{analysis.bpm}</span>
                    </div>
                  )}
                  {analysis?.key && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-neutral-500">Key</span>
                      <span className="font-medium">{analysis.key}</span>
                    </div>
                  )}
                  <button
                    onClick={handleDownloadAll}
                    className="flex items-center gap-2 bg-neutral-100 hover:bg-neutral-300 text-neutral-950 px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors duration-150"
                  >
                    <Download className="w-4 h-4" />
                    Download all (ZIP)
                  </button>
                </div>

                {/* Stems */}
                <div className="flex flex-col gap-3 mt-3">
                  {stems.map((stem) => (
                    <StemCard key={stem.name} {...stem} />
                  ))}
                </div>

                <div className="mt-5 mb-2 text-center">
                  <button
                    onClick={handleReset}
                    className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors duration-150"
                  >
                    Separate another track
                  </button>
                </div>
              </>
            )}
          </>
        )}

        <Library
          items={library}
          activeSessionId={currentSessionId}
          onOpen={handleOpenSession}
          onDelete={handleDeleteSession}
          onClearAll={handleClearAll}
        />
      </div>
    </div>
  );
}
