import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Newspaper, RefreshCw, Loader, Globe, TrendingUp, ExternalLink } from 'lucide-react';

// Category color mapping
const CATEGORY_COLORS = {
  technology: 'bg-blue-100 text-blue-800',
  business: 'bg-green-100 text-green-800',
  politics: 'bg-red-100 text-red-800',
  health: 'bg-purple-100 text-purple-800',
  environment: 'bg-teal-100 text-teal-800',
  general: 'bg-gray-100 text-gray-800'
};

const TrendingStories = ({ onSelectStory }) => {
  const [trendingStories, setTrendingStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState(['all', 'technology', 'business', 'politics', 'health', 'environment', 'general']);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchTrendingStories();
  }, [selectedCategory]);

  const fetchTrendingStories = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let url = '/api/trending';
      if (selectedCategory !== 'all') {
        url = `/api/trending/category/${selectedCategory}`;
      }
      
      const response = await axios.get(url);
      setTrendingStories(response.data);
    } catch (error) {
      console.error('Error fetching trending stories:', error);
      setError('Failed to fetch trending stories. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    
    try {
      await axios.post('/api/trending/refresh');
      await fetchTrendingStories();
    } catch (error) {
      console.error('Error refreshing trending stories:', error);
      setError('Failed to refresh trending stories. Please try again later.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
  };

  const handleStorySelect = (story) => {
    // Convert trending story to news article format for AI analysis
    const newsArticle = {
      id: story.id,
      title: story.title,
      summary: story.summary,
      content: story.perspectives.map(p => `${p.source}: ${p.title} - ${p.summary}`).join('\n\n'),
      source: story.sources.join(', '),
      date: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      category: story.category,
      url: story.perspectives[0]?.link || '',
      perspectives: story.perspectives
    };
    
    onSelectStory(newsArticle);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold flex items-center">
          <TrendingUp className="mr-2" size={20} />
          Trending Stories
        </h2>
        <div className="flex items-center">
          <select
            className="mr-3 px-2 py-1 border border-gray-300 rounded-md text-sm"
            value={selectedCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
          <button 
            onClick={handleRefresh} 
            disabled={refreshing}
            className="p-1 rounded-full hover:bg-gray-100 text-gray-600"
            title="Refresh trending stories"
          >
            <RefreshCw className={refreshing ? 'animate-spin' : ''} size={18} />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-8">
          <Loader className="animate-spin text-blue-500 mr-2" size={24} />
          <span>Loading trending stories...</span>
        </div>
      ) : trendingStories.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Newspaper className="mx-auto mb-3 text-gray-300" size={32} />
          <p>No trending stories found for this category.</p>
          <button 
            onClick={handleRefresh}
            className="mt-3 px-4 py-2 bg-blue-100 text-blue-700 rounded-md text-sm"
          >
            Refresh Stories
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {trendingStories.map(story => (
            <div 
              key={story.id}
              className="border border-gray-200 rounded-lg p-4 hover:bg-blue-50 cursor-pointer transition-colors overflow-hidden"
              onClick={() => handleStorySelect(story)}
            >
              <h3 className="font-medium text-lg mb-2">{story.title}</h3>
              {story.summary && (
                <p className="text-gray-600 mb-3">{story.summary}</p>
              )}
              <div className="flex flex-wrap items-center text-sm text-gray-500 mb-2">
                <span className="flex items-center mr-4">
                  <Globe className="mr-1" size={14} />
                  {story.sourceCount} sources
                </span>
                <span className={`${CATEGORY_COLORS[story.category] || 'bg-gray-100 text-gray-800'} px-2 py-0.5 rounded-full text-xs`}>
                  {story.category}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 mt-3 max-w-full">
                {story.perspectives.slice(0, 3).map((perspective, index) => (
                  <div key={index} className="bg-gray-100 text-xs px-2 py-1 rounded flex items-center truncate max-w-[45%]">
                    <span className="truncate">{perspective.source}</span>
                    <a 
                      href={perspective.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="ml-1 flex-shrink-0 text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink size={12} />
                    </a>
                  </div>
                ))}
                {story.perspectives.length > 3 && (
                  <div className="bg-gray-100 text-xs px-2 py-1 rounded flex-shrink-0">
                    +{story.perspectives.length - 3} more
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrendingStories;
