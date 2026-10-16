import { useMemo, useState } from 'react';
import { Download, Search, Trash2, X } from 'lucide-react';
import type { LibraryItem } from '../lib/api';
import { downloadFile } from '../lib/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

interface SidebarProps {
  items: LibraryItem[];
  activeSessionId: string | null;
  serverUp: boolean;
  onOpen: (item: LibraryItem) => void;
  onDelete: (sessionId: string) => void;
  onClearAll: () => void;
  onClose: () => void;
}

function fmtDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) +
    ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export function Sidebar({ items, activeSessionId, serverUp, onOpen, onDelete, onClearAll, onClose }: SidebarProps) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(i => i.track_name.toLowerCase().includes(q));
  }, [items, query]);

  return (
    <aside className="flex w-[280px] shrink-0 flex-col border-r border-neutral-800 bg-neutral-950/85 backdrop-blur-md">
      {/* Header */}
      <div className="border-b border-neutral-800 px-4 py-4">
        <div className="flex items-center justify-between">
          <img src="./stemify-hor.png" alt="Stemify — The Audio Splitter" className="h-8 w-auto" />
          <button
            onClick={onClose}
            className="p-1 text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800 rounded-md transition-colors duration-150"
            title="Close library"
          >
            <X size={14} />
          </button>
        </div>
        <div className="relative mt-4">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search sessions…"
            className="w-full rounded-lg border border-neutral-800 bg-neutral-900 py-1.5 pl-8 pr-3 text-[12px] text-neutral-100 outline-none transition-all placeholder:text-neutral-600 hover:border-neutral-700 focus:border-pink-500/60"
          />
        </div>
      </div>

      {/* Sessions list */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="flex items-center justify-between px-2 py-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-neutral-500">
            Library
          </span>
          <span className="rounded-md border border-neutral-800 bg-neutral-900 px-1.5 text-[10px] text-neutral-400">
            {filtered.length}
          </span>
        </div>

        {filtered.map((item) => (
          <div
            key={item.session_id}
            className={`group relative mb-0.5 rounded-lg transition-all duration-150 ${
              item.session_id === activeSessionId
                ? 'bg-neutral-800/60 ring-1 ring-pink-500/50'
                : 'hover:bg-neutral-900'
            }`}
          >
            {item.session_id === activeSessionId && (
              <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-gradient-to-b from-pink-500 to-purple-500" />
            )}
            <button
              onClick={() => onOpen(item)}
              className="w-full px-3 py-2 pl-4 text-left"
            >
              <div className="truncate text-[13px] font-medium leading-tight text-neutral-200">
                {item.track_name}
              </div>
              <div className="mt-0.5 flex items-center gap-2 text-[11px] text-neutral-500">
                {fmtDate(item.created_at)}
                {item.bpm && <span className="tabular-nums">{item.bpm} BPM</span>}
                {item.key && <span>{item.key}</span>}
              </div>
            </button>
            <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-0.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
              <button
                onClick={() => downloadFile(
                  `${API_URL}/download-all/${item.session_id}`,
                  `${item.track_name}-stems.zip`
                )}
                className="p-1 text-neutral-500 hover:text-neutral-200 rounded"
                title="Download all stems (ZIP)"
              >
                <Download size={13} />
              </button>
              <button
                onClick={() => onDelete(item.session_id)}
                className="p-1 text-neutral-500 hover:text-red-400 rounded"
                title="Delete session"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="px-3 py-8 text-center text-[12px] text-neutral-600">
            {items.length === 0 ? 'No sessions yet' : 'No matches'}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-neutral-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-neutral-500">
            <span className={`h-1.5 w-1.5 rounded-full ${serverUp ? 'bg-green-500' : 'bg-red-500'}`} />
            {serverUp ? 'Backend connected' : 'Offline'}
          </div>
          {items.length > 0 && (
            <button
              onClick={onClearAll}
              className="flex items-center gap-1 text-[11px] text-neutral-600 hover:text-red-400 transition-colors duration-150"
              title="Delete all sessions"
            >
              <X size={11} />
              Clear all
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
