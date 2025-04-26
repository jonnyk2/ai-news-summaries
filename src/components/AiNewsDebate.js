import React, { useState, useEffect } from 'react';
import { fetchLatestNews, fetchNewsByCategory } from '../services/newsService';
import { getAIAnalysis } from '../services/aiService';
import { MessageSquare, RefreshCw, Newspaper, Globe, ThumbsUp, Filter, Loader, BookmarkCheck, TrendingUp } from 'lucide-react';
import TrendingStories from './TrendingStories';
import Header from './Header';
import { useAuth } from '../context/AuthContext';

// Category color mapping
const CATEGORY_COLORS = {
  technology: 'bg-blue-100 text-blue-800',
  business: 'bg-green-100 text-green-800',
  politics: 'bg-red-100 text-red-800',
  health: 'bg-purple-100 text-purple-800',
  environment: 'bg-teal-100 text-teal-800',
  general: 'bg-gray-100 text-gray-800'
};

// AI models configuration with their details
const AI_MODELS = [
  { 
    id: 'chatgpt', 
    name: 'ChatGPT', 
    provider: 'OpenAI',
    avatar: 'C', 
    color: 'bg-green-100 text-green-800',
    description: 'Widely used AI chatbot that can analyze and provide perspectives on current events.'
  },
  { 
    id: 'claude', 
    name: 'Claude', 
    provider: 'Anthropic',
    avatar: 'C', 
    color: 'bg-purple-100 text-purple-800',
    description: 'Known for its nuanced responses and ethical boundaries, capable of providing thoughtful analysis.'
  },
  { 
    id: 'gemini', 
    name: 'Gemini', 
    provider: 'Google',
    avatar: 'G', 
    color: 'bg-blue-100 text-blue-800',
    description: 'Google\'s chatbot with multimodal capabilities that can analyze text, images, and provide opinions.'
  },
  { 
    id: 'copilot', 
    name: 'Copilot', 
    provider: 'Microsoft',
    avatar: 'C', 
    color: 'bg-cyan-100 text-cyan-800',
    description: 'Integrated with Microsoft products and able to process news and provide summaries and analysis.'
  },
  { 
    id: 'deepseek', 
    name: 'DeepSeek', 
    provider: 'DeepSeek',
    avatar: 'D', 
    color: 'bg-amber-100 text-amber-800',
    description: 'A newer AI system with breakthrough capabilities in reasoning about complex topics.'
  },
  { 
    id: 'cohere', 
    name: 'Command', 
    provider: 'Cohere',
    avatar: 'C', 
    color: 'bg-indigo-100 text-indigo-800',
    description: 'An enterprise AI platform that provides LLMs for news analysis and summarization.'
  },
  { 
    id: 'newscord', 
    name: 'Newscord', 
    provider: 'Newscord',
    avatar: 'N', 
    color: 'bg-red-100 text-red-800',
    description: 'AI tool that summarizes top news articles with customizable filters.'
  },
  { 
    id: 'channel1', 
    name: 'Channel 1', 
    provider: 'Channel 1 AI',
    avatar: 'C1', 
    color: 'bg-orange-100 text-orange-800',
    description: 'A personalized global news network powered by generative AI.'
  },
  { 
    id: 'listen2', 
    name: 'Listen2', 
    provider: 'Listen2.ai',
    avatar: 'L2', 
    color: 'bg-teal-100 text-teal-800',
    description: 'AI-powered news aggregator with controllable political perspective.'
  },
  { 
    id: 'reka', 
    name: 'Reka', 
    provider: 'Reka AI',
    avatar: 'R', 
    color: 'bg-rose-100 text-rose-800',
    description: 'A multimodal assistant that can analyze information across various formats.'
  }
];

const AiNewsDebate = () => {
  console.log('AiNewsDebate component rendering');
  
  // Error boundary for component
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Global error handler
  useEffect(() => {
    const handleError = (error) => {
      console.error('Global error caught:', error);
      setHasError(true);
      setErrorMessage(error.message || 'An unknown error occurred');
    };
    
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);
  const [news, setNews] = useState([]);
  const [selectedNews, setSelectedNews] = useState(null);
  const [selectedAIs, setSelectedAIs] = useState(AI_MODELS.slice(0, 4).map(ai => ai.id)); // Default to first 4 AIs
  const [aiResponses, setAiResponses] = useState({});
  const [debateMode, setDebateMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingResponses, setLoadingResponses] = useState(false);
  const [currentDate] = useState(new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }));
  const [newsCategory, setNewsCategory] = useState('technology');
  const [showAISelector, setShowAISelector] = useState(false);
  const [showTrending, setShowTrending] = useState(false);

  // Fetch news articles
  useEffect(() => {
    fetchNews();
  }, [newsCategory]); // eslint-disable-line react-hooks/exhaustive-deps

  // When selected news changes, fetch AI responses
  useEffect(() => {
    if (selectedNews) {
      fetchAIResponses();
    }
  }, [selectedNews, selectedAIs]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchNews = async () => {
    setLoading(true);
    try {
      let newsData;
      
      if (newsCategory === 'all') {
        newsData = await fetchLatestNews();
      } else {
        newsData = await fetchNewsByCategory(newsCategory);
      }
      
      setNews(newsData);
      if (newsData.length > 0 && !selectedNews) {
        setSelectedNews(newsData[0].id);
      }
    } catch (error) {
      console.error("Error fetching news:", error);
      // Fallback to mock data if API fails
      const mockNewsData = [
        {
          id: 1,
          title: "New Renewable Energy Policy Announced",
          summary: "Government unveils ambitious plan to reach 70% renewable energy by 2030",
          source: "Energy Today",
          date: "April 25, 2025",
          category: "environment",
          url: "https://example.com/renewable-policy"
        },
        {
          id: 2,
          title: "Major Breakthrough in Quantum Computing",
          summary: "Researchers achieve stable 500-qubit processor, bringing practical quantum computing closer to reality",
          source: "Tech Weekly",
          date: "April 25, 2025",
          category: "technology",
          url: "https://example.com/quantum-breakthrough"
        }
      ];
      
      // Filter by category if needed
      const filteredNews = newsCategory === 'all' 
        ? mockNewsData 
        : mockNewsData.filter(item => item.category === newsCategory);
      
      setNews(filteredNews);
      if (filteredNews.length > 0 && !selectedNews) {
        setSelectedNews(filteredNews[0].id);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAIResponses = async () => {
    if (!selectedNews) return;
    
    setLoadingResponses(true);
    
    try {
      const selectedArticle = news.find(n => n.id === selectedNews);
      
      if (!selectedArticle) {
        console.error('Selected article not found');
        return;
      }
      
      // Call our backend API to get AI responses
      const responses = await getAIAnalysis(selectedArticle, selectedAIs);
      
      setAiResponses(prev => ({
        ...prev,
        [selectedNews]: responses
      }));
    } catch (error) {
      console.error("Error fetching AI responses:", error);
      
      // Fallback to mock responses if API fails
      const selectedArticle = news.find(n => n.id === selectedNews);
      const mockResponses = {};
      
      selectedAIs.forEach(aiId => {
        const category = selectedArticle.category || 'general';
        let response = '';
        
        if (category === 'technology') {
          if (aiId === 'chatgpt') {
            response = `This ${selectedArticle.title.toLowerCase()} represents significant progress in the field. The implications for industry and society could be substantial, though we should be cautious about implementation timelines.`;
          } else if (aiId === 'claude') {
            response = `The ${selectedArticle.title.toLowerCase()} is noteworthy for its potential to transform multiple sectors. I'd emphasize that ethical considerations should be prioritized alongside technological advancement.`;
          } else {
            response = `Analyzing the ${selectedArticle.title.toLowerCase()}, I see both immediate applications and longer-term implications. The technical challenges mentioned suggest a gradual rather than immediate impact.`;
          }
        } else {
          if (aiId === 'chatgpt') {
            response = `This ${selectedArticle.title.toLowerCase()} is a positive step toward addressing challenges. The targets are ambitious but necessary given current trends.`;
          } else if (aiId === 'claude') {
            response = `The ${selectedArticle.title.toLowerCase()} represents meaningful progress. I would note that implementation will require balancing goals with economic considerations and social equity.`;
          } else {
            response = `The ${selectedArticle.title.toLowerCase()} represents a step in the right direction. Success will depend on implementation details, cooperation, and sustained commitment from all parties.`;
          }
        }
        
        mockResponses[aiId] = response;
      });
      
      setAiResponses(prev => ({
        ...prev,
        [selectedNews]: mockResponses
      }));
    } finally {
      setLoadingResponses(false);
    }
  };

  const handleRefresh = () => {
    fetchNews();
  };

  const toggleDebateMode = () => {
    setDebateMode(!debateMode);
  };

  const toggleAISelector = () => {
    setShowAISelector(!showAISelector);
  };

  const toggleAISelection = (aiId) => {
    if (selectedAIs.includes(aiId)) {
      // Don't allow deselecting if only one AI is selected
      if (selectedAIs.length > 1) {
        setSelectedAIs(selectedAIs.filter(id => id !== aiId));
      }
    } else {
      // Limit to max 5 AIs
      if (selectedAIs.length < 5) {
        setSelectedAIs([...selectedAIs, aiId]);
      }
    }
  };

  const handleCategoryChange = (category) => {
    setNewsCategory(category);
    setSelectedNews(null);
    setShowTrending(false);
  };
  
  const handleTrendingStorySelect = (story) => {
    // When a trending story is selected, add it to our news array
    // and select it for AI analysis
    const existingStory = news.find(item => item.id === story.id);
    
    if (!existingStory) {
      setNews(prevNews => [story, ...prevNews]);
    }
    
    setSelectedNews(story.id);
    setShowTrending(false);
  };
  
  const toggleTrendingView = () => {
    setShowTrending(!showTrending);
  };

  // Generate a debate-style conversation from individual responses
  const generateDebate = () => {
    if (!selectedNews || !aiResponses[selectedNews]) return [];
    
    const responses = aiResponses[selectedNews];
    const selectedAIModels = AI_MODELS.filter(ai => selectedAIs.includes(ai.id));
    
    // Create an array of debate messages
    let debate = [];
    
    // First round: initial statements
    selectedAIModels.forEach(ai => {
      if (responses[ai.id]) {
        debate.push({
          aiId: ai.id,
          message: responses[ai.id]
        });
      }
    });
    
    // Second round: responses to others
    if (selectedAIModels.length > 1) {
      selectedAIModels.forEach((ai, index) => {
        // Skip if no initial response
        if (!responses[ai.id]) return;
        
        // Pick another AI to respond to
        const otherIndex = (index + 1) % selectedAIModels.length;
        const otherAi = selectedAIModels[otherIndex];
        
        if (responses[otherAi.id]) {
          const rebuttalMessages = [
            `I agree with some points made by ${otherAi.name}, but would add that consideration of long-term implications is crucial here.`,
            `While ${otherAi.name} raises valid points, I'd emphasize that the practical implementation may face more challenges than anticipated.`,
            `Building on ${otherAi.name}'s analysis, I think we should also consider the broader societal impacts of this development.`,
            `I see merit in ${otherAi.name}'s perspective, though I would place more emphasis on the ethical dimensions of this issue.`
          ];
          
          debate.push({
            aiId: ai.id,
            message: rebuttalMessages[Math.floor(Math.random() * rebuttalMessages.length)]
          });
        }
      });
    }
    
    // Third round: synthesis if at least 3 AIs
    if (selectedAIModels.length >= 3) {
      const synthesizer = selectedAIModels[selectedAIModels.length - 1];
      
      debate.push({
        aiId: synthesizer.id,
        message: `Synthesizing our different perspectives, I think we can agree that this development has significant implications. The key areas where we seem to differ are on implementation timeline and the balance of benefits versus risks.`
      });
    }
    
    return debate;
  };

  // Extract key insights from the debate
  const extractKeyInsights = () => {
    if (!selectedNews || !aiResponses[selectedNews]) return [];
    
    return [
      "All AIs acknowledge the significance of this development",
      "Implementation timeline is a point of disagreement",
      "Ethical considerations are emphasized by multiple AIs",
      "Economic implications are viewed differently by various AIs"
    ];
  };

  // Get auth context
  const { currentUser, userPreferences, saveArticle, recordArticleView } = useAuth();
  
  // Apply user preferences if available
  useEffect(() => {
    if (userPreferences) {
      // Set preferred categories
      if (userPreferences.preferred_categories && userPreferences.preferred_categories.length > 0) {
        setNewsCategory(userPreferences.preferred_categories[0]);
      }
      
      // Set preferred AI models
      if (userPreferences.preferred_ai_models && userPreferences.preferred_ai_models.length > 0) {
        setSelectedAIs(userPreferences.preferred_ai_models);
      }
    }
  }, [userPreferences]);
  
  // Record article view in reading history when a news article is selected
  useEffect(() => {
    if (selectedNews && currentUser) {
      recordArticleView(selectedNews);
    }
  }, [selectedNews, currentUser, recordArticleView]);
  
  // Handle saving an article
  const handleSaveArticle = (articleId) => {
    if (currentUser) {
      saveArticle(articleId);
    }
  };
  
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <Header 
        currentDate={currentDate}
        newsCategory={newsCategory}
        handleCategoryChange={handleCategoryChange}
        toggleTrendingView={toggleTrendingView}
        showTrending={showTrending}
        handleRefresh={handleRefresh}
        loading={loading}
      />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* News Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-800 flex items-center">
              {showTrending ? (
                <>
                  <TrendingUp className="mr-2" size={18} />
                  Trending Stories
                </>
              ) : (
                <>
                  <Newspaper className="mr-2" size={18} />
                  Latest News
                </>
              )}
            </h2>
          </div>
          
          {showTrending ? (
            <div className="p-2 w-full">
              <TrendingStories onSelectStory={handleTrendingStorySelect} />
            </div>
          ) : loading ? (
            <div className="flex justify-center items-center h-32">
              <Loader className="animate-spin text-blue-500" size={24} />
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {news.map(item => (
                <div 
                  key={item.id} 
                  className={`p-4 cursor-pointer hover:bg-gray-50 ${selectedNews === item.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                  onClick={() => setSelectedNews(item.id)}
                >
                  <h3 className="font-medium text-gray-800">{item.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{item.source} • {item.date}</p>
                  {item.perspectives && (
                    <div className="mt-1 flex items-center">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                          {item.perspectives.length} perspectives
                        </span>
                        {item.category && (
                          <span className={`text-xs ${CATEGORY_COLORS[item.category] || 'bg-gray-100 text-gray-800'} px-2 py-0.5 rounded-full`}>
                            {item.category}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Selected News */}
          {selectedNews && (
            <div className="p-6 bg-white border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">
                {news.find(n => n.id === selectedNews)?.title}
              </h2>
              <p className="mt-2 text-gray-600">
                {news.find(n => n.id === selectedNews)?.summary}
              </p>
              <div className="mt-4 flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  Source: {news.find(n => n.id === selectedNews)?.source}
                </span>
                <div className="flex space-x-2">
                  {currentUser && (
                    <button 
                      onClick={() => handleSaveArticle(selectedNews)}
                      className="px-4 py-2 rounded-md text-sm font-medium bg-green-100 text-green-700 flex items-center"
                    >
                      <BookmarkCheck className="mr-2" size={16} />
                      Save Article
                    </button>
                  )}
                  <button 
                    onClick={toggleAISelector}
                    className="px-4 py-2 rounded-md text-sm font-medium bg-gray-100 text-gray-700 flex items-center"
                  >
                    <Filter className="mr-2" size={16} />
                    Select AIs ({selectedAIs.length})
                  </button>
                  <button 
                    onClick={toggleDebateMode}
                    className={`px-4 py-2 rounded-md text-sm font-medium flex items-center ${
                      debateMode ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    <MessageSquare className="mr-2" size={16} />
                    {debateMode ? 'View Individual Opinions' : 'Start AI Debate'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* AI Selection Modal */}
          {showAISelector && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Select AI Models (Max 5)</h3>
                  <button 
                    onClick={toggleAISelector}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {AI_MODELS.map(ai => (
                    <div 
                      key={ai.id}
                      className={`border rounded-lg p-4 cursor-pointer ${
                        selectedAIs.includes(ai.id) 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => toggleAISelection(ai.id)}
                    >
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${ai.color}`}>
                          {ai.avatar}
                        </div>
                        <div className="ml-3">
                          <h4 className="font-medium text-gray-800">{ai.name}</h4>
                          <p className="text-xs text-gray-500">{ai.provider}</p>
                        </div>
                        {selectedAIs.includes(ai.id) && (
                          <div className="ml-auto bg-blue-500 text-white rounded-full p-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <p className="mt-2 text-sm text-gray-600">{ai.description}</p>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={toggleAISelector}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md"
                  >
                    Apply Selection
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* AI Opinions */}
          <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
            {selectedNews ? (
              loadingResponses ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <Loader className="animate-spin text-blue-500 mb-4" size={32} />
                  <p className="text-gray-600">Gathering AI perspectives...</p>
                </div>
              ) : !debateMode ? (
                // Individual AI opinions
                <div className="grid grid-cols-1 gap-4">
                  {selectedAIs.map(aiId => {
                    const ai = AI_MODELS.find(a => a.id === aiId);
                    const response = aiResponses[selectedNews]?.[aiId];
                    
                    return (
                      <div key={ai.id} className="bg-white rounded-lg shadow-sm p-4">
                        <div className="flex items-center mb-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${ai.color}`}>
                            {ai.avatar}
                          </div>
                          <div className="ml-3">
                            <h3 className="font-medium text-gray-800">{ai.name}</h3>
                            <p className="text-xs text-gray-500">{ai.provider}</p>
                          </div>
                        </div>
                        <p className="text-gray-700">
                          {response || "No response available."}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                // AI Debate mode
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">AI Debate</h3>
                  
                  <div className="space-y-6">
                    {generateDebate().map((entry, index) => {
                      const ai = AI_MODELS.find(a => a.id === entry.aiId);
                      
                      return (
                        <div key={index} className="flex items-start">
                          <div className={`mt-1 w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center font-medium ${ai.color}`}>
                            {ai.avatar}
                          </div>
                          <div className="ml-4 bg-gray-50 rounded-lg p-4 flex-1">
                            <div className="font-medium text-gray-800 mb-2">{ai.name}</div>
                            <p className="text-gray-700">{entry.message}</p>
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Key Insights panel */}
                    <div className="mt-8 p-4 bg-white border border-gray-200 rounded-lg">
                      <h4 className="font-medium text-gray-800 mb-2">Key Insights from this Debate</h4>
                      <ul className="text-gray-700 space-y-2">
                        {extractKeyInsights().map((insight, index) => (
                          <li key={index}>• {insight}</li>
                        ))}
                      </ul>
                      <div className="mt-4 flex justify-between">
                        <button className="px-3 py-2 bg-gray-100 text-gray-600 rounded-md text-sm flex items-center">
                          <Filter className="mr-2" size={14} />
                          Show More Perspectives
                        </button>
                        <button className="px-3 py-2 bg-blue-100 text-blue-700 rounded-md text-sm flex items-center">
                          <ThumbsUp className="mr-2" size={14} />
                          Rate AI Analyses
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <Newspaper size={48} className="mb-4 text-gray-300" />
                <p>Select a news article to see AI perspectives</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="text-sm text-gray-500">
            AI News Debate Platform - Daily insights from multiple AI perspectives
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={toggleAISelector}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-600 flex items-center text-sm"
            >
              <Globe className="mr-1" size={16} />
              Customize AI Sources
            </button>
            {currentUser && userPreferences && (
              <div className="text-xs text-gray-500">
                Personalized for {currentUser.username} • {userPreferences.preferred_categories?.length || 0} categories • {userPreferences.preferred_ai_models?.length || 0} AI models
              </div>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AiNewsDebate;
