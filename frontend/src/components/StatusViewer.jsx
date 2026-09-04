import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Trash2, ChevronLeft, ChevronRight, Send, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';

function StatusViewer({ group, isOwn, onClose }) {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [mediaReady, setMediaReady] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  const [viewers, setViewers] = useState([]);
  const [loadingViewers, setLoadingViewers] = useState(false);
  const intervalRef = useRef(null);
  const videoRef = useRef(null);
  const DURATION = 5000;

  const current = group.statuses[index];
  const isVideo = current.type === 'video';
  const isImage = current.type === 'image';
  const isText = current.type === 'text';

  useEffect(() => {
    if (!isOwn) {
      api.put(`/status/${current._id}/view`).catch(() => {});
    }

    setProgress(0);
    setMediaReady(isText); // text is "ready" immediately, image/video wait to load
    if (intervalRef.current) clearInterval(intervalRef.current);

    return () => clearInterval(intervalRef.current);
  }, [index]);

  useEffect(() => {
    if (!mediaReady || isVideo) return; // video progress handled by onTimeUpdate

    const startTime = Date.now();
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min((elapsed / DURATION) * 100, 100);
      setProgress(pct);
      if (pct >= 100) {
        goNext();
      }
    }, 50);

    return () => clearInterval(intervalRef.current);
  }, [mediaReady]);

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

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setSendingReply(true);
    try {
      await api.post(`/messages/${group.user._id}`, { text: replyText.trim() });
      toast.success('Reply sent');
      setReplyText('');
      onClose();
      navigate('/chat', { state: { openUserId: group.user._id } });
    } catch (error) {
      toast.error('Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  const openViewers = async () => {
    setShowViewers(true);
    setLoadingViewers(true);
    if (intervalRef.current) clearInterval(intervalRef.current);
    try {
      const res = await api.get(`/status/${current._id}/viewers`);
      setViewers(res.data.viewers);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingViewers(false);
    }
  };

  const closeViewers = () => {
    setShowViewers(false);
    // restart timer fresh for current status
    setMediaReady(isText || isImage ? true : mediaReady);
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
                transition: i === index && isVideo ? 'width 0.15s linear' : 'none',
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
        {!mediaReady && !isText && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        <button onClick={goPrev} className="absolute left-0 top-0 w-1/3 h-full z-10" />
        <button onClick={goNext} className="absolute right-0 top-0 w-1/3 h-full z-10" />

        {isText ? (
          <div
            className="w-full h-full flex items-center justify-center px-8"
            style={{ backgroundColor: current.backgroundColor }}
          >
            <p className="text-white text-2xl font-semibold text-center leading-relaxed">{current.content}</p>
          </div>
        ) : isImage ? (
          <img
            src={current.content}
            alt="status"
            className={`max-w-full max-h-full object-contain ${mediaReady ? '' : 'invisible'}`}
            onLoad={() => setMediaReady(true)}
          />
        ) : (
          <video
            key={current._id}
            ref={videoRef}
            src={current.content}
            autoPlay
            playsInline
            className={`max-w-full max-h-full object-contain ${mediaReady ? '' : 'invisible'}`}
            onCanPlay={() => setMediaReady(true)}
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

      {/* Bottom bar: viewers (own) or reply (others) */}
      {isOwn ? (
        <button
          onClick={openViewers}
          className="flex items-center gap-2 px-4 py-3 text-white/90"
        >
          <Eye size={18} />
          <span className="text-sm">{current.viewers?.length || 0} view{current.viewers?.length === 1 ? '' : 's'}</span>
        </button>
      ) : (
        <form onSubmit={handleSendReply} className="p-3 flex items-center gap-2">
          <input
            type="text"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder={`Reply to ${group.user.name}...`}
            className="flex-1 px-4 py-2.5 rounded-full bg-white/10 text-white placeholder-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
          />
          <button
            type="submit"
            disabled={sendingReply || !replyText.trim()}
            className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center disabled:opacity-40 flex-shrink-0"
          >
            <Send size={18} />
          </button>
        </form>
      )}

      {/* Viewers sheet */}
      {showViewers && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-end" onClick={closeViewers}>
          <div
            className="bg-gray-900 rounded-t-2xl w-full max-h-[60vh] overflow-y-auto p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold">Viewed by</h3>
              <button onClick={closeViewers} className="text-white/70">
                <X size={20} />
              </button>
            </div>
            {loadingViewers ? (
              <div className="flex justify-center py-6">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : viewers.length === 0 ? (
              <p className="text-white/50 text-sm text-center py-6">No views yet</p>
            ) : (
              viewers.map((v) => (
                <div key={v.user._id} className="flex items-center gap-3 py-2">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-primary/20 flex items-center justify-center text-white font-semibold flex-shrink-0">
                    {v.user.profilePic ? (
                      <img src={v.user.profilePic} alt={v.user.name} className="w-full h-full object-cover" />
                    ) : (
                      v.user.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <p className="text-white text-sm">{v.user.name}</p>
                    <p className="text-white/50 text-xs">
                      {new Date(v.viewedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default StatusViewer;