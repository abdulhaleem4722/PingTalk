import { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';

function AudioMessage({ src, isMe }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 min-w-[200px]">
      <audio ref={audioRef} src={src} preload="metadata" />
      <button
        onClick={togglePlay}
        className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
          isMe ? 'bg-white/20 text-white' : 'bg-primary/15 text-primary'
        }`}
      >
        {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
      </button>
      <div className="flex-1 flex items-center gap-2">
        <div className={`flex-1 h-1 rounded-full overflow-hidden ${isMe ? 'bg-white/25' : 'bg-gray-300 dark:bg-gray-600'}`}>
          <div
            className={`h-full rounded-full ${isMe ? 'bg-white' : 'bg-primary'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className={`text-[10px] flex-shrink-0 ${isMe ? 'text-white/70' : 'text-gray-400'}`}>
          {formatTime(audioRef.current?.currentTime > 0 ? (isPlaying ? audioRef.current.currentTime : duration) : duration)}
        </span>
      </div>
    </div>
  );
}

export default AudioMessage;