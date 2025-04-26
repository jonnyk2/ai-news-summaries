import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

// Create the authentication context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Provider component that wraps the app and makes auth object available to any child component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userPreferences, setUserPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Configure axios to include credentials
  useEffect(() => {
    axios.defaults.withCredentials = true;
  }, []);

  // Check if user is already logged in
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (token) {
          // Set the authorization header for all requests
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Fetch user profile
          const response = await axios.get('/api/users/profile');
          setCurrentUser(response.data.user);
          
          // Fetch user preferences
          const prefsResponse = await axios.get('/api/users/preferences');
          setUserPreferences(prefsResponse.data.preferences);
        }
      } catch (err) {
        console.error('Auth check error:', err);
        // Clear token if invalid
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Register a new user
  const register = async (username, email, password) => {
    try {
      setError(null);
      const response = await axios.post('/api/users/register', {
        username,
        email,
        password
      });
      
      // Store token in localStorage
      localStorage.setItem('token', response.data.token);
      
      // Set the authorization header for future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      
      // Update state with user data
      setCurrentUser(response.data.user);
      
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      throw err;
    }
  };

  // Login user
  const login = async (email, password) => {
    try {
      setError(null);
      const response = await axios.post('/api/users/login', {
        email,
        password
      });
      
      // Store token in localStorage
      localStorage.setItem('token', response.data.token);
      
      // Set the authorization header for future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      
      // Update state with user data
      setCurrentUser(response.data.user);
      
      // Fetch user preferences
      const prefsResponse = await axios.get('/api/users/preferences');
      setUserPreferences(prefsResponse.data.preferences);
      
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    }
  };

  // Logout user
  const logout = async () => {
    try {
      await axios.post('/api/users/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      // Clear token from localStorage
      localStorage.removeItem('token');
      
      // Remove authorization header
      delete axios.defaults.headers.common['Authorization'];
      
      // Clear user state
      setCurrentUser(null);
      setUserPreferences(null);
    }
  };

  // Update user preferences
  const updatePreferences = async (preferences) => {
    try {
      setError(null);
      const response = await axios.put('/api/users/preferences', preferences);
      
      // Update preferences in state
      setUserPreferences(prev => ({
        ...prev,
        ...preferences
      }));
      
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update preferences');
      throw err;
    }
  };

  // Save article
  const saveArticle = async (articleId) => {
    if (!currentUser) return;
    
    try {
      await axios.post('/api/users/saved-articles', { article_id: articleId });
    } catch (err) {
      console.error('Error saving article:', err);
    }
  };

  // Get saved articles
  const getSavedArticles = async () => {
    if (!currentUser) return [];
    
    try {
      const response = await axios.get('/api/users/saved-articles');
      return response.data.saved_articles;
    } catch (err) {
      console.error('Error fetching saved articles:', err);
      return [];
    }
  };

  // Record article view in reading history
  const recordArticleView = async (articleId) => {
    if (!currentUser) return;
    
    try {
      await axios.post('/api/users/reading-history', { article_id: articleId });
    } catch (err) {
      console.error('Error recording article view:', err);
    }
  };

  // Value object that will be supplied to consumers of this context
  const value = {
    currentUser,
    userPreferences,
    loading,
    error,
    register,
    login,
    logout,
    updatePreferences,
    saveArticle,
    getSavedArticles,
    recordArticleView
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
