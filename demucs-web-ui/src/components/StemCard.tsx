interface StemCardProps {
  name: string;
  url: string;
  color: string;
  onDownload: () => void;
}

export function StemCard({ name, color, onDownload }: StemCardProps) {
  return (
    <div className={`p-6 rounded-lg border border-white/10 backdrop-blur-sm 
      transition-all duration-300 hover:scale-[1.02] hover:border-white/20`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-4 h-4 rounded-full ${color}`} />
          <h3 className="text-lg font-semibold">{name}</h3>
        </div>
        
        <button
          onClick={onDownload}
          className="px-4 py-2 rounded-md bg-white/10 hover:bg-white/20 
            transition-colors duration-200 flex items-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Download
        </button>
      </div>
    </div>
  );
}