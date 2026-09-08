import { Phone, PhoneOff, Mic, MicOff, User } from 'lucide-react';
import { useCall } from '../context/CallContext';

function CallOverlay() {
  const { callState, remoteUser, callDuration, isMuted, acceptCall, rejectCall, endCall, toggleMute } = useCall();

  if (callState === 'idle') return null;

  const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const statusText =
    callState === 'calling' ? 'Calling...' :
    callState === 'ringing' ? 'Incoming call' :
    callState === 'connected' ? formatDuration(callDuration) : '';

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-primary-dark to-bg-dark z-[100] flex flex-col items-center justify-between py-16 px-6">
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <div className="w-32 h-32 rounded-full bg-white/10 flex items-center justify-center overflow-hidden ring-4 ring-white/20">
          {remoteUser?.profilePic ? (
            <img src={remoteUser.profilePic} alt={remoteUser.name} className="w-full h-full object-cover" />
          ) : (
            <User size={56} className="text-white/70" />
          )}
        </div>
        <h2 className="text-white text-2xl font-semibold">{remoteUser?.name}</h2>
        <p className="text-white/70 text-sm">{statusText}</p>
      </div>

      {callState === 'ringing' ? (
        <div className="flex items-center gap-16">
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={rejectCall}
              className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center active:scale-90 transition-transform"
            >
              <PhoneOff size={26} className="text-white" />
            </button>
            <span className="text-white/70 text-xs">Decline</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={acceptCall}
              className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center active:scale-90 transition-transform animate-pulse"
            >
              <Phone size={26} className="text-white" />
            </button>
            <span className="text-white/70 text-xs">Accept</span>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-8">
          {callState === 'connected' && (
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={toggleMute}
                className={`w-14 h-14 rounded-full flex items-center justify-center active:scale-90 transition-transform ${
                  isMuted ? 'bg-white text-primary-dark' : 'bg-white/15 text-white'
                }`}
              >
                {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
              </button>
              <span className="text-white/70 text-xs">{isMuted ? 'Unmute' : 'Mute'}</span>
            </div>
          )}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={endCall}
              className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center active:scale-90 transition-transform"
            >
              <PhoneOff size={26} className="text-white" />
            </button>
            <span className="text-white/70 text-xs">End</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default CallOverlay;