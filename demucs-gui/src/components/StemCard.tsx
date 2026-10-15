import { useEffect, useRef, useState, useCallback } from 'react';
import { Download, Play, Pause } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

interface StemCardProps {
  name: string;
  url: string;
  color: string;      // tailwind class for the dot, e.g. 'bg-pink-500'
  waveColor: string;  // hex color for the waveform, e.g. '#ec4899'
}

const PEAK_BARS = 160;

export function StemCard({ name, url, color, waveColor }: StemCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const peaksRef = useRef<number[]>([]);
  const rafRef = useRef<number>(0);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);   // 0..1
  const [duration, setDuration] = useState(0);
  const [ready, setReady] = useState(false);

  const drawWave = useCallback((pos: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth * dpr;
    const h = canvas.clientHeight * dpr;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    ctx.clearRect(0, 0, w, h);

    const peaks = peaksRef.current;
    if (!peaks.length) return;

    const barW = w / peaks.length;
    const gap = Math.min(2 * dpr, barW * 0.25);
    const mid = h / 2;

    for (let i = 0; i < peaks.length; i++) {
      const played = i / peaks.length <= pos;
      ctx.fillStyle = played ? waveColor : 'rgba(156, 163, 175, 0.35)';
      const barH = Math.max(2 * dpr, peaks[i] * (h * 0.9));
      ctx.fillRect(i * barW, mid - barH / 2, Math.max(1, barW - gap), barH);
    }
  }, [waveColor]);

  // Decode audio and compute peaks
  useEffect(() => {
    let cancelled = false;
    setReady(false);
    peaksRef.current = [];

    (async () => {
      try {
        const res = await fetch(`${API_URL}${url}`);
        const buf = await res.arrayBuffer();
        const ctx = new AudioContext();
        const decoded = await ctx.decodeAudioData(buf);
        const data = decoded.getChannelData(0);
        const step = Math.floor(data.length / PEAK_BARS) || 1;
        const peaks: number[] = [];
        for (let i = 0; i < PEAK_BARS; i++) {
          let max = 0;
          for (let j = i * step; j < (i + 1) * step && j < data.length; j += 8) {
            const v = Math.abs(data[j]);
            if (v > max) max = v;
          }
          peaks.push(max);
        }
        // normalize
        const maxPeak = Math.max(...peaks, 0.01);
        peaksRef.current = peaks.map(p => p / maxPeak);
        ctx.close();
        if (!cancelled) {
          setDuration(decoded.duration);
          setReady(true);
          drawWave(0);
        }
      } catch (e) {
        console.warn(`Waveform load failed for ${name}:`, e);
      }
    })();

    return () => { cancelled = true; };
  }, [url, name, drawWave]);

  // Animation loop while playing
  useEffect(() => {
    const tick = () => {
      const audio = audioRef.current;
      if (audio && audio.duration > 0) {
        setProgress(audio.currentTime / audio.duration);
        drawWave(audio.currentTime / audio.duration);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    if (playing) {
      rafRef.current = requestAnimationFrame(tick);
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, drawWave]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play();
      setPlaying(true);
    }
  };

  const seek = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    audio.currentTime = pos * duration;
    setProgress(pos);
    drawWave(pos);
  };

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 hover:border-neutral-700 transition-colors duration-150">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-2 h-2 rounded-full ${color}`} />
          <h3 className="text-sm font-medium capitalize">{name}</h3>
        </div>
        <button
          className="p-1.5 text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800 rounded-md transition-colors duration-150"
          onClick={() => window.open(`${API_URL}${url}`, '_blank')}
          title={`Download ${name} stem`}
        >
          <Download className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={togglePlay}
          disabled={!ready}
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-150 ${
            ready
              ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-100'
              : 'bg-neutral-900 text-neutral-700 cursor-wait'
          }`}
          title={playing ? 'Pause' : 'Play'}
        >
          {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
        </button>

        <div className="flex-1 relative">
          <canvas
            ref={canvasRef}
            onClick={seek}
            className={`w-full h-11 block ${ready ? 'cursor-pointer' : ''}`}
          />
          {!ready && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs text-neutral-600">Loading waveform…</span>
            </div>
          )}
        </div>

        <span className="flex-shrink-0 text-xs text-neutral-500 tabular-nums w-16 text-right">
          {duration ? `${fmt(progress * duration)} / ${fmt(duration)}` : ''}
        </span>
      </div>

      <audio
        ref={audioRef}
        src={`${API_URL}${url}`}
        className="stem-audio"
        onEnded={() => { setPlaying(false); setProgress(0); drawWave(0); }}
        preload="none"
      />
    </div>
  );
}
