import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Settings, BookmarkCheck, Clock, Save, AlertCircle } from 'lucide-react';

// Category color mapping from the existing app
const CATEGORY_COLORS = {
  technology: 'bg-blue-100 text-blue-800',
  business: 'bg-green-100 text-green-800',
  politics: 'bg-red-100 text-red-800',
  health: 'bg-purple-100 text-purple-800',
  environment: 'bg-teal-100 text-teal-800',
  general: 'bg-gray-100 text-gray-800'
};

const UserProfile = ({ onClose }) => {
  const { currentUser, userPreferences, updatePreferences, getSavedArticles, logout } = useAuth();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [savedArticles, setSavedArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Form state for preferences
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedAIModels, setSelectedAIModels] = useState([]);
  const [theme, setTheme] = useState('light');
  
  // Available categories and AI models
  const availableCategories = ['technology', 'business', 'politics', 'health', 'environment', 'general'];
  const availableAIModels = [
    { id: 'chatgpt', name: 'ChatGPT', provider: 'OpenAI' },
    { id: 'claude', name: 'Claude', provider: 'Anthropic' },
    { id: 'gemini', name: 'Gemini', provider: 'Google' },
    { id: 'copilot', name: 'Copilot', provider: 'Microsoft' },
    { id: 'deepseek', name: 'DeepSeek', provider: 'DeepSeek' },
    { id: 'cohere', name: 'Command', provider: 'Cohere' },
    { id: 'newscord', name: 'Newscord', provider: 'Newscord' },
    { id: 'channel1', name: 'Channel 1', provider: 'Channel 1 AI' },
    { id: 'listen2', name: 'Listen2', provider: 'Listen2.ai' },
    { id: 'reka', name: 'Reka', provider: 'Reka AI' }
  ];
  
  // Initialize form with user preferences
  useEffect(() => {
    if (userPreferences) {
      setSelectedCategories(userPreferences.preferred_categories || []);
      setSelectedAIModels(userPreferences.preferred_ai_models || []);
      setTheme(userPreferences.theme || 'light');
    }
  }, [userPreferences]);
  
  // Fetch saved articles
  useEffect(() => {
    const fetchSavedArticles = async () => {
      if (activeTab === 'saved') {
        setIsLoading(true);
        try {
          const articles = await getSavedArticles();
          setSavedArticles(articles);
        } catch (error) {
          console.error('Error fetching saved articles:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    fetchSavedArticles();
  }, [activeTab, getSavedArticles]);
  
  const handleSavePreferences = async () => {
    setIsLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      await updatePreferences({
        preferred_categories: selectedCategories,
        preferred_ai_models: selectedAIModels,
        theme
      });
      
      setMessage({ 
        type: 'success', 
        text: 'Preferences saved successfully' 
      });
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: 'Failed to save preferences' 
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const toggleCategory = (category) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };
  
  const toggleAIModel = (modelId) => {
    if (selectedAIModels.includes(modelId)) {
      // Don't allow deselecting if only one AI is selected
      if (selectedAIModels.length > 1) {
        setSelectedAIModels(selectedAIModels.filter(id => id !== modelId));
      }
    } else {
      // Limit to max 5 AIs
      if (selectedAIModels.length < 5) {
        setSelectedAIModels([...selectedAIModels, modelId]);
      }
    }
  };
  
  const handleLogout = () => {
    logout();
    onClose();
  };
  
  return (
    <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
      <div className="flex justify-between items-center p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <User className="mr-2" size={24} />
          {currentUser?.username}'s Profile
        </h2>
        <button 
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-48 bg-gray-50 border-r border-gray-200 p-4">
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full text-left px-3 py-2 rounded-md flex items-center ${
                activeTab === 'profile' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <User className="mr-2" size={18} />
              Profile
            </button>
            <button
              onClick={() => setActiveTab('preferences')}
              className={`w-full text-left px-3 py-2 rounded-md flex items-center ${
                activeTab === 'preferences' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Settings className="mr-2" size={18} />
              Preferences
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`w-full text-left px-3 py-2 rounded-md flex items-center ${
                activeTab === 'saved' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <BookmarkCheck className="mr-2" size={18} />
              Saved Articles
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`w-full text-left px-3 py-2 rounded-md flex items-center ${
                activeTab === 'history' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Clock className="mr-2" size={18} />
              Reading History
            </button>
          </nav>
          
          <div className="mt-8 pt-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="w-full px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
        
        {/* Main content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-4">Account Information</h3>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-500 mb-1">Username</label>
                  <p className="text-gray-800">{currentUser?.username}</p>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                  <p className="text-gray-800">{currentUser?.email}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Account Created</label>
                  <p className="text-gray-800">
                    {new Date(currentUser?.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Account Actions</h3>
                
                <div className="space-y-3">
                  <button className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-left">
                    Change Password
                  </button>
                  <button className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-left">
                    Update Email
                  </button>
                  <button className="w-full px-4 py-2 bg-red-50 text-red-700 rounded-md hover:bg-red-100 text-left">
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-4">Customize Your Experience</h3>
              
              {message.text && (
                <div className={`mb-4 p-3 rounded-md flex items-start ${
                  message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  {message.type === 'error' ? (
                    <AlertCircle className="mr-2 flex-shrink-0 mt-0.5" size={16} />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  <span>{message.text}</span>
                </div>
              )}
              
              <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-2">Preferred News Categories</h4>
                <p className="text-sm text-gray-500 mb-3">Select the categories you're most interested in</p>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {availableCategories.map(category => (
                    <button
                      key={category}
                      onClick={() => toggleCategory(category)}
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        selectedCategories.includes(category)
                          ? CATEGORY_COLORS[category] || 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-2">Preferred AI Models (Max 5)</h4>
                <p className="text-sm text-gray-500 mb-3">Select up to 5 AI models for analysis</p>
                
                <div className="grid grid-cols-2 gap-2">
                  {availableAIModels.map(ai => (
                    <button
                      key={ai.id}
                      onClick={() => toggleAIModel(ai.id)}
                      className={`px-3 py-2 rounded-md text-sm font-medium flex items-center justify-between ${
                        selectedAIModels.includes(ai.id)
                          ? 'bg-blue-100 text-blue-700 border border-blue-300'
                          : 'bg-gray-100 text-gray-700 border border-transparent'
                      }`}
                    >
                      <span>{ai.name}</span>
                      {selectedAIModels.includes(ai.id) && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-2">Theme</h4>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setTheme('light')}
                    className={`px-4 py-2 rounded-md ${
                      theme === 'light' 
                        ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    Light
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`px-4 py-2 rounded-md ${
                      theme === 'dark' 
                        ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    Dark
                  </button>
                </div>
              </div>
              
              <button
                onClick={handleSavePreferences}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Save className="mr-2" size={18} />
                    Save Preferences
                  </span>
                )}
              </button>
            </div>
          )}
          
          {/* Saved Articles Tab */}
          {activeTab === 'saved' && (
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-4">Saved Articles</h3>
              
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : savedArticles.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <BookmarkCheck className="mx-auto mb-3 text-gray-300" size={32} />
                  <p>You haven't saved any articles yet.</p>
                  <p className="mt-2 text-sm">Articles you save will appear here for easy access.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {savedArticles.map(article => (
                    <div key={article.article_id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                      <h4 className="font-medium text-gray-800">Article #{article.article_id}</h4>
                      <p className="text-sm text-gray-500 mt-1">
                        Saved on {new Date(article.saved_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      <div className="mt-2 flex justify-end">
                        <button className="text-sm text-blue-600 hover:text-blue-800">
                          View Article
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Reading History Tab */}
          {activeTab === 'history' && (
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-4">Reading History</h3>
              
              <div className="text-center py-8 text-gray-500">
                <Clock className="mx-auto mb-3 text-gray-300" size={32} />
                <p>Your reading history will appear here.</p>
                <p className="mt-2 text-sm">This feature is coming soon!</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
