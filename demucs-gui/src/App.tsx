import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { FileUpload } from './components/FileUpload';
import { StemCard } from './components/StemCard';
import { uploadAudio, checkServerStatus, cleanupSession, getLibrary, clearLibrary, downloadFile } from './lib/api';
import type { LibraryItem } from './lib/api';
import { Download, Music2, Gauge, FileMusic, Library as LibraryIcon, RotateCcw } from 'lucide-react';

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
  const [format, setFormat] = useState<'wav' | 'mp3'>('wav');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [muted, setMuted] = useState<Record<string, boolean>>({});

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
      setSidebarOpen(true);

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
      const q = format === 'mp3' ? '?format=mp3' : '';
      downloadFile(
        `${API_URL}/download-all/${currentSessionId}${q}`,
        `${trackName || 'stems'}-stems-${format}.zip`
      );
    }
  };

  const handleReset = () => {
    setStems([]);
    setAnalysis(null);
    setTrackName('');
    setCurrentSessionId(null);
    setMuted({});
  };

  const toggleMute = (name: string) => {
    setMuted(m => ({ ...m, [name]: !m[name] }));
  };

  const handleOpenSession = (item: LibraryItem) => {
    setCurrentSessionId(item.session_id);
    setTrackName(item.track_name);
    setAnalysis({ bpm: item.bpm, key: item.key });
    setSidebarOpen(true);
    const s = item.stems;
    setStems([
      { name: 'Vocals', url: s.vocals || '', ...STEM_COLORS.Vocals },
      { name: 'Drums', url: s.drums || '', ...STEM_COLORS.Drums },
      { name: 'Bass', url: s.bass || '', ...STEM_COLORS.Bass },
      { name: 'Instrumental', url: s.instrumental || '', ...STEM_COLORS.Instrumental },
    ]);
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
  const sidebarWidth = sidebarOpen ? 280 : 0;

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-950 text-neutral-100">
      {sidebarOpen && (
        <Sidebar
          items={library}
          activeSessionId={currentSessionId}
          serverUp={serverUp}
          onOpen={handleOpenSession}
          onDelete={handleDeleteSession}
          onClearAll={handleClearAll}
          onClose={() => setSidebarOpen(false)}
        />
      )}

      {/* Main panel */}
      <main className="relative flex-1 overflow-y-auto">
        {/* Background image */}
        <div
          className="fixed inset-y-0 right-0 bg-cover bg-center pointer-events-none transition-all duration-200"
          style={{ backgroundImage: "url('./background.jpg')", left: sidebarWidth }}
        />
        {(hasResults || isProcessing) && (
          <div
            className="fixed inset-y-0 right-0 bg-neutral-950/80 pointer-events-none transition-all duration-200"
            style={{ left: sidebarWidth }}
          />
        )}

        {/* Library toggle (top-right) */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-neutral-900/70 hover:bg-neutral-800 border border-neutral-700 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs text-neutral-300 transition-colors duration-150"
            title="Open library"
          >
            <LibraryIcon size={13} />
            Library
            {library.length > 0 && (
              <span className="rounded-md bg-neutral-800 px-1.5 text-[10px] text-neutral-400">{library.length}</span>
            )}
          </button>
        )}

        <div className="relative flex min-h-full flex-col px-8 py-6">
          {/* Initial view: dropzone centered */}
          {!hasResults && !isProcessing && (
            <div className="flex flex-1 flex-col">
              <div className="flex-1" />
              <FileUpload
                isProcessing={isProcessing}
                onFileUpload={handleFileUpload}
                progress={progress}
                progressMessage={progressMessage}
                hasResult={false}
              />
              {error && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-center text-red-300 text-sm">
                  {error}
                </div>
              )}
              <div className="flex-1" />
            </div>
          )}

          {/* Processing view */}
          {isProcessing && (
            <div className="flex flex-1 flex-col justify-center">
              <FileUpload
                isProcessing={isProcessing}
                onFileUpload={handleFileUpload}
                progress={progress}
                progressMessage={progressMessage}
                hasResult={false}
              />
              {error && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-center text-red-300 text-sm">
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Results view */}
          {hasResults && (
            <>
              {/* Song info bar */}
              <div className="bg-neutral-900/90 border border-neutral-800 rounded-lg p-4 flex flex-wrap items-center gap-x-5 gap-y-3">
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

                {/* Format toggle */}
                <div className="flex items-center bg-neutral-800 border border-neutral-700 rounded-md p-0.5 text-xs">
                  {(['wav', 'mp3'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setFormat(f)}
                      className={`px-2.5 py-1 rounded transition-colors duration-150 uppercase tracking-wide ${
                        format === f ? 'bg-neutral-100 text-neutral-950 font-medium' : 'text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>

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
                  <StemCard
                    key={stem.name}
                    {...stem}
                    format={format}
                    muted={!!muted[stem.name]}
                    onToggleMute={() => toggleMute(stem.name)}
                  />
                ))}
              </div>

              <div className="mt-5 mb-2 flex justify-center">
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 px-4 py-2 rounded-md text-sm font-semibold text-white transition-all duration-150 shadow-lg shadow-pink-500/20"
                >
                  <RotateCcw className="w-4 h-4" />
                  Separate another track
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
