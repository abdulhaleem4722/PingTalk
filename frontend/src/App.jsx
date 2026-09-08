import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Signup from './pages/Signup';
import VerifyOTP from './pages/VerifyOTP';
import Login from './pages/Login';
import ChatHome from './pages/ChatHome';
import Profile from './pages/Profile';
import StatusPage from './pages/StatusPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {

  const [currentScreen, setCurrentScreen] = useState('login');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setCurrentScreen('chat');
      console.log('Token found:', token);
    }
  })

  return (
    <Routes>
      <Route path="/" element={<Signup />} />
      <Route path="/verify-otp" element={<VerifyOTP />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <ChatHome />
          </ProtectedRoute>
        }
      />
      <Route
        path="/status"
        element={
          <ProtectedRoute>
            <StatusPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;