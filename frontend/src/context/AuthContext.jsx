import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import api from '../api/axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const socketRef = useRef(null);

  const connectSocket = (userId) => {
    if (socketRef.current) return;

    const socket = io('https://pingtalk-production.up.railway.app', {
      query: { userId },
    });

    socket.on('getOnlineUsers', (users) => {
      setOnlineUsers(users);
    });

    socketRef.current = socket;
  };

  const disconnectSocket = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  };

  const checkAuth = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.user);
      connectSocket(res.data.user._id || res.data.user.id);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
    return () => disconnectSocket();
  }, []);

  const login = (userData) => {
    setUser(userData);
    connectSocket(userData.id);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error(error);
    } finally {
      setUser(null);
      disconnectSocket();
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, checkAuth, onlineUsers, socket: socketRef.current }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);