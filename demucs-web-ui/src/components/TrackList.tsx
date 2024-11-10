import { FC } from 'react';
import { Music4 } from 'lucide-react';
import { Track } from '../types'; // Importa il tipo Track da types.ts

interface TrackListProps {
  tracks: Track[];
}

export const TrackList: FC<TrackListProps> = ({ tracks }) => {
  if (tracks.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-gray-800">Processed Tracks</h2>
      <div className="grid gap-4">
        {tracks.map((track) => (
          <div
            key={track.id}
            className="bg-white rounded-lg shadow-md p-6 space-y-4"
          >
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 rounded-lg p-2">
                <Music4 className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-800">{track.name}</h3>
            </div>

            {track.status === 'completed' && track.result && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(track.result).map(([stemName, stemUrl]) => {
                  if (typeof stemUrl !== 'string') return null;
                  return (
                    <div
                      key={stemName}
                      className="bg-gray-50 rounded-lg p-4 space-y-2"
                    >
                      <h4 className="font-medium text-gray-700 capitalize">
                        {stemName}
                      </h4>
                      <audio controls className="w-full" src={stemUrl}>
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  );
                })}
              </div>
            )}

            {track.status !== 'completed' && (
              <div className="text-gray-600">
                {track.status === 'processing' && 'Processing...'}
                {track.status === 'uploading' && 'Uploading...'}
                {track.status === 'error' && `Error: ${track.error}`}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};