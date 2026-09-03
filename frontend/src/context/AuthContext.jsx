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
    const token = localStorage.getItem('pingtalk_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await api.get('/auth/me');
      setUser(res.data.user);
      if (res.data.token) {
        localStorage.setItem('pingtalk_token', res.data.token);
      }
      connectSocket(res.data.user._id || res.data.user.id);
    } catch (error) {
      localStorage.removeItem('pingtalk_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
    return () => disconnectSocket();
  }, []);

  const login = (userData, token) => {
    if (token) {
      localStorage.setItem('pingtalk_token', token);
    }
    setUser(userData);
    connectSocket(userData._id || userData.id);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error(error);
    } finally {
      localStorage.removeItem('pingtalk_token');
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