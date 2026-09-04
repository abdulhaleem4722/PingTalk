import { useState, useEffect, useRef } from 'react';
import { X, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';

function StatusViewer({ group, isOwn, onClose }) {
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef(null);
  const videoRef = useRef(null);
  const DURATION = 5000; // for image/text only

  const current = group.statuses[index];
  const isVideo = current.type === 'video';

  useEffect(() => {
    // Mark as viewed
    if (!isOwn) {
      api.put(`/status/${current._id}/view`).catch(() => {});
    }

    setProgress(0);
    if (intervalRef.current) clearInterval(intervalRef.current);

    // Only auto-advance by timer for text/image; video advances via onEnded
    if (!isVideo) {
      const startTime = Date.now();
      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const pct = Math.min((elapsed / DURATION) * 100, 100);
        setProgress(pct);
        if (pct >= 100) {
          goNext();
        }
      }, 50);
    }

    return () => clearInterval(intervalRef.current);
  }, [index]);

  const goNext = () => {
    if (index < group.statuses.length - 1) {
      setIndex((i) => i + 1);
    } else {
      onClose();
    }
  };

  const goPrev = () => {
    if (index > 0) {
      setIndex((i) => i - 1);
    }
  };

  const handleVideoTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    setProgress((video.currentTime / video.duration) * 100);
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this status?')) return;
    try {
      await api.delete(`/status/${current._id}`);
      toast.success('Status deleted');
      if (group.statuses.length === 1) {
        onClose();
      } else {
        goNext();
      }
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Progress bars */}
      <div className="flex gap-1 p-2 pt-3">
        {group.statuses.map((s, i) => (
          <div key={s._id} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full"
              style={{
                width: i < index ? '100%' : i === index ? `${progress}%` : '0%',
                transition: i === index && !isVideo ? 'none' : 'width 0.15s linear',
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full overflow-hidden bg-primary/20 flex items-center justify-center text-white font-semibold flex-shrink-0">
            {group.user.profilePic ? (
              <img src={group.user.profilePic} alt={group.user.name} className="w-full h-full object-cover" />
            ) : (
              group.user.name.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <p className="text-white text-sm font-medium">{isOwn ? 'My Status' : group.user.name}</p>
            <p className="text-white/60 text-xs">
              {new Date(current.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isOwn && (
            <button onClick={handleDelete} className="text-white/80 hover:text-white">
              <Trash2 size={20} />
            </button>
          )}
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X size={24} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {/* Tap zones */}
        <button onClick={goPrev} className="absolute left-0 top-0 w-1/3 h-full z-10" />
        <button onClick={goNext} className="absolute right-0 top-0 w-1/3 h-full z-10" />

        {current.type === 'text' ? (
          <div
            className="w-full h-full flex items-center justify-center px-8"
            style={{ backgroundColor: current.backgroundColor }}
          >
            <p className="text-white text-2xl font-semibold text-center leading-relaxed">{current.content}</p>
          </div>
        ) : current.type === 'image' ? (
          <img src={current.content} alt="status" className="max-w-full max-h-full object-contain" />
        ) : (
          <video
            key={current._id}
            ref={videoRef}
            src={current.content}
            autoPlay
            playsInline
            className="max-w-full max-h-full object-contain"
            onTimeUpdate={handleVideoTimeUpdate}
            onEnded={goNext}
          />
        )}
      </div>

      {/* Nav hints (desktop) */}
      {index > 0 && (
        <button onClick={goPrev} className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/10 items-center justify-center text-white z-20">
          <ChevronLeft size={20} />
        </button>
      )}
      <button onClick={goNext} className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/10 items-center justify-center text-white z-20">
        <ChevronRight size={20} />
      </button>
    </div>
  );
}

export default StatusViewer;