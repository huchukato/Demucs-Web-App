import { Download, Trash2, FolderOpen, FileMusic, X } from 'lucide-react';
import type { LibraryItem } from '../lib/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

interface LibraryProps {
  items: LibraryItem[];
  activeSessionId: string | null;
  onOpen: (item: LibraryItem) => void;
  onDelete: (sessionId: string) => void;
  onClearAll: () => void;
}

function fmtDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) +
    ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export function Library({ items, activeSessionId, onOpen, onDelete, onClearAll }: LibraryProps) {
  if (items.length === 0) return null;

  return (
    <div className="mt-10">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-neutral-300">Library</h3>
        <button
          onClick={onClearAll}
          className="text-xs text-neutral-500 hover:text-red-400 transition-colors duration-150 flex items-center gap-1"
        >
          <X className="w-3 h-3" />
          Clear all
        </button>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-lg divide-y divide-neutral-800">
        {items.map((item) => (
          <div
            key={item.session_id}
            className={`flex items-center gap-4 px-4 py-3 transition-colors duration-150 ${
              item.session_id === activeSessionId ? 'bg-neutral-800/50' : 'hover:bg-neutral-800/30'
            }`}
          >
            <FileMusic className="w-4 h-4 text-neutral-500 flex-shrink-0" />

            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate">{item.track_name}</div>
              <div className="text-xs text-neutral-500 flex items-center gap-3">
                {fmtDate(item.created_at)}
                {item.bpm && <span className="tabular-nums">{item.bpm} BPM</span>}
                {item.key && <span>{item.key}</span>}
              </div>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => onOpen(item)}
                className={`p-1.5 rounded-md transition-colors duration-150 ${
                  item.session_id === activeSessionId
                    ? 'text-pink-400'
                    : 'text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800'
                }`}
                title={item.session_id === activeSessionId ? 'Currently open' : 'Open in player'}
              >
                <FolderOpen className="w-4 h-4" />
              </button>
              <button
                onClick={() => window.open(`${API_URL}/download-all/${item.session_id}`, '_blank')}
                className="p-1.5 text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800 rounded-md transition-colors duration-150"
                title="Download all stems (ZIP)"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(item.session_id)}
                className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-neutral-800 rounded-md transition-colors duration-150"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
