import React from 'react';
import { Download, Music2, Video, Loader2 } from 'lucide-react';
import type { Track } from '../types';
import { VideoPreview } from './VideoPreview';

interface Props {
  tracks: Track[];
}

export function TrackList({ tracks }: Props) {
  if (tracks.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-2xl space-y-4">
      {tracks.map((track) => (
        <div
          key={track.id}
          className="bg-white rounded-lg shadow-md p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {track.file?.type.startsWith('video/') ? (
                <Video className="text-blue-500" />
              ) : (
                <Music2 className="text-blue-500" />
              )}
              <span className="font-medium">{track.name}</span>
            </div>
            <span className="text-sm text-gray-500 capitalize">{track.status}</span>
          </div>

          {track.file?.type.startsWith('video/') && (
            <VideoPreview file={track.file} />
          )}

          {track.status === 'processing' && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                <span className="text-sm text-gray-600">Processing: {track.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${track.progress}%` }}
                />
              </div>
            </div>
          )}

          {track.status === 'completed' && track.result && (
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(track.result).map(([stem, url]) => (
                <a
                  key={stem}
                  href={url}
                  download={`${track.name}-${stem}.wav`}
                  className="flex items-center justify-center space-x-2 p-2 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span className="capitalize">{stem}</span>
                </a>
              ))}
            </div>
          )}

          {track.status === 'error' && (
            <p className="text-sm text-red-500">{track.error}</p>
          )}
        </div>
      ))}
    </div>
  );
}