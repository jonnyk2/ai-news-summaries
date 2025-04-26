import React, { useState } from 'react';
import Login from './Login';
import Register from './Register';
import UserProfile from './UserProfile';
import { useAuth } from '../../context/AuthContext';

const AuthModal = ({ isOpen, onClose, initialView = 'login' }) => {
  const [currentView, setCurrentView] = useState(initialView);
  const { currentUser } = useAuth();
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      {currentUser ? (
        <UserProfile onClose={onClose} />
      ) : currentView === 'login' ? (
        <Login 
          onClose={onClose} 
          onSwitchToRegister={() => setCurrentView('register')} 
        />
      ) : (
        <Register 
          onClose={onClose} 
          onSwitchToLogin={() => setCurrentView('login')} 
        />
      )}
    </div>
  );
};

export default AuthModal;
