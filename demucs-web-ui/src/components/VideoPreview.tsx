import React from 'react';

interface Props {
  file: File;
}

export function VideoPreview({ file }: Props) {
  const videoUrl = React.useMemo(() => URL.createObjectURL(file), [file]);

  React.useEffect(() => {
    return () => URL.revokeObjectURL(videoUrl);
  }, [videoUrl]);

  return (
    <div className="w-full max-w-2xl rounded-lg overflow-hidden shadow-lg bg-black">
      <video 
        src={videoUrl} 
        controls
        className="w-full h-auto"
        controlsList="nodownload"
      >
        Your browser does not support the video element.
      </video>
    </div>
  );
}