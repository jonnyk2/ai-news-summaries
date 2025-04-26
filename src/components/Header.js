import React, { useState } from 'react';
import { BarChart2, User, LogIn, TrendingUp, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AuthModal from './auth/AuthModal';

const Header = ({ 
  currentDate, 
  newsCategory, 
  handleCategoryChange, 
  toggleTrendingView, 
  showTrending, 
  handleRefresh, 
  loading 
}) => {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { currentUser } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800 flex items-center">
          <BarChart2 className="mr-2" size={24} />
          AI News Debate Platform
        </h1>
        
        <div className="flex items-center">
          <div className="mr-4">
            <select 
              className="bg-white border border-gray-300 rounded-md px-3 py-1 text-sm"
              value={newsCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
            >
              <option value="all">All Categories</option>
              <option value="technology">Technology</option>
              <option value="environment">Environment</option>
              <option value="politics">Politics</option>
              <option value="health">Health</option>
              <option value="business">Business</option>
            </select>
          </div>
          
          <button
            onClick={toggleTrendingView}
            className={`mr-3 px-3 py-1 rounded-md text-sm font-medium flex items-center ${
              showTrending ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700'
            }`}
          >
            <TrendingUp className="mr-1" size={16} />
            Trending Stories
          </button>
          
          <span className="text-gray-600 mr-4">{currentDate}</span>
          
          {currentUser ? (
            <button 
              onClick={() => setAuthModalOpen(true)}
              className="flex items-center px-3 py-1 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100"
            >
              <User className="mr-1" size={16} />
              <span className="max-w-[100px] truncate">{currentUser.username}</span>
            </button>
          ) : (
            <button 
              onClick={() => setAuthModalOpen(true)}
              className="flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              <LogIn className="mr-1" size={16} />
              Login
            </button>
          )}
          
          <button 
            onClick={handleRefresh} 
            className="ml-3 p-2 rounded-full hover:bg-gray-100"
            disabled={loading}
          >
            <svg 
              className={`${loading ? 'animate-spin' : ''} text-gray-600`} 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                d="M4 4V9H4.58152M19.9381 11C19.446 7.05369 16.0796 4 12 4C8.64262 4 5.76829 6.06817 4.58152 9M4.58152 9H9M20 20V15H19.4185M19.4185 15C18.2317 17.9318 15.3574 20 12 20C7.92038 20 4.55399 16.9463 4.06189 13M19.4185 15H15" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
      
      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
      />
    </header>
  );
};

export default Header;
