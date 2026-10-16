interface HeaderProps {
  serverUp: boolean;
}

export function Header({ serverUp }: HeaderProps) {
  return (
    <div className="flex items-center justify-between mb-10">
      <img
        src="./stemify-hor.png"
        alt="Stemify"
        className="h-9 w-auto"
      />
      <div className="flex items-center gap-2 text-xs text-neutral-500">
        <span className={`w-1.5 h-1.5 rounded-full ${serverUp ? 'bg-green-500' : 'bg-red-500'}`} />
        {serverUp ? 'Connected' : 'Offline'}
      </div>
    </div>
  );
}
