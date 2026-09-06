import { createContext, useContext, useState, useRef, useEffect } from 'react';
import { useAuth } from './AuthContext';
import api from '../api/axios';

const CallContext = createContext();

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export function CallProvider({ children }) {
  const { socket, user } = useAuth();
  const [callState, setCallState] = useState('idle');
  const [remoteUser, setRemoteUser] = useState(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const pendingOfferRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const wasConnectedRef = useRef(false);
  const isCallerRef = useRef(false);
  const callDurationRef = useRef(0);
  const myId = user?._id || user?.id;

  const logCall = async (targetUserId, status) => {
    if (!targetUserId) return;
    try {
      await api.post('/calls', {
        receiverId: targetUserId,
        status,
        duration: callDurationRef.current,
      });
    } catch (error) {
      console.error('Failed to log call', error);
    }
  };

  const cleanup = (finalStatus) => {
    const targetId = remoteUser?._id;

    if (finalStatus && targetId) {
      // Only the caller logs the call, to avoid duplicate entries
      if (isCallerRef.current) {
        logCall(targetId, finalStatus);
      }
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setCallState('idle');
    setRemoteUser(null);
    setCallDuration(0);
    callDurationRef.current = 0;
    setIsMuted(false);
    pendingOfferRef.current = null;
    wasConnectedRef.current = false;
    isCallerRef.current = false;
  };

  const createPeerConnection = (targetUserId) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('iceCandidate', { to: targetUserId, candidate: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = event.streams[0];
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  };

  const startCall = async (targetUser) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;

      const pc = createPeerConnection(targetUser._id);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      setRemoteUser(targetUser);
      setCallState('calling');
      isCallerRef.current = true;

      socket.emit('callUser', {
        to: targetUser._id,
        from: myId,
        offer,
        callerName: user.name,
        callerPic: user.profilePic,
      });
    } catch (error) {
      console.error('Failed to start call', error);
      cleanup();
    }
  };

  const acceptCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;

      const pc = createPeerConnection(remoteUser._id);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(pendingOfferRef.current));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit('answerCall', { to: remoteUser._id, answer });

      setCallState('connected');
      wasConnectedRef.current = true;
      startTimer();
    } catch (error) {
      console.error('Failed to accept call', error);
      cleanup();
    }
  };

  const rejectCall = () => {
    if (remoteUser) {
      socket.emit('rejectCall', { to: remoteUser._id });
    }
    cleanup(isCallerRef.current ? null : 'rejected');
  };

  const endCall = () => {
    if (remoteUser) {
      socket.emit('endCall', { to: remoteUser._id });
    }
    const status = wasConnectedRef.current ? 'answered' : 'missed';
    cleanup(status);
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const startTimer = () => {
    setCallDuration(0);
    callDurationRef.current = 0;
    timerIntervalRef.current = setInterval(() => {
      callDurationRef.current += 1;
      setCallDuration(callDurationRef.current);
    }, 1000);
  };

  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = ({ from, offer, callerName, callerPic }) => {
      if (callState !== 'idle') {
        socket.emit('rejectCall', { to: from });
        return;
      }
      pendingOfferRef.current = offer;
      isCallerRef.current = false;
      setRemoteUser({ _id: from, name: callerName, profilePic: callerPic });
      setCallState('ringing');
    };

    const handleCallAnswered = async ({ answer }) => {
      const pc = peerConnectionRef.current;
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        setCallState('connected');
        wasConnectedRef.current = true;
        startTimer();
      }
    };

    const handleIceCandidate = async ({ candidate }) => {
      const pc = peerConnectionRef.current;
      if (pc && candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
          console.error('Error adding ICE candidate', error);
        }
      }
    };

    const handleCallRejected = () => {
      // Caller's side: the other person rejected -> log as rejected
      cleanup('rejected');
    };

    const handleCallEnded = () => {
      const status = wasConnectedRef.current ? null : 'missed';
      // Receiver side generally doesn't log (only caller logs), just cleanup
      cleanup(status && !isCallerRef.current ? null : status);
    };

    const handleCallFailed = () => {
      cleanup(isCallerRef.current ? 'missed' : null);
    };

    socket.on('incomingCall', handleIncomingCall);
    socket.on('callAnswered', handleCallAnswered);
    socket.on('iceCandidate', handleIceCandidate);
    socket.on('callRejected', handleCallRejected);
    socket.on('callEnded', handleCallEnded);
    socket.on('callFailed', handleCallFailed);

    return () => {
      socket.off('incomingCall', handleIncomingCall);
      socket.off('callAnswered', handleCallAnswered);
      socket.off('iceCandidate', handleIceCandidate);
      socket.off('callRejected', handleCallRejected);
      socket.off('callEnded', handleCallEnded);
      socket.off('callFailed', handleCallFailed);
    };
  }, [socket, callState]);

  return (
    <CallContext.Provider
      value={{
        callState,
        remoteUser,
        callDuration,
        isMuted,
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
      }}
    >
      {children}
      <audio ref={remoteAudioRef} autoPlay />
    </CallContext.Provider>
  );
}

export const useCall = () => useContext(CallContext);