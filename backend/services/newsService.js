const fs = require('fs');
const path = require('path');
const { fetchNewsWithFallback, NEWS_SOURCES } = require('./newsFetcher');

// In-memory cache for news articles
let newsCache = {
  articles: [],
  lastUpdated: null,
  categories: {} // Cache for category-specific articles
};

// Path to store news data
const dataDir = path.join(__dirname, '../data');
const newsFilePath = path.join(dataDir, 'news.json');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize news data from file if it exists
try {
  if (fs.existsSync(newsFilePath)) {
    const data = fs.readFileSync(newsFilePath, 'utf8');
    newsCache = JSON.parse(data);
    console.log(`Loaded ${newsCache.articles.length} news articles from cache`);
  }
} catch (error) {
  console.error('Error loading news cache from file:', error);
}

/**
 * Update news cache with latest articles
 * @param {string} category - Optional category to update
 * @param {boolean} forceUpdate - Force update even if cache is recent
 * @returns {Promise<Array>} Array of news articles
 */
const updateNewsCache = async (category = 'all', forceUpdate = false) => {
  try {
    // Configure sources based on available API keys
    const sources = [];
    
    if (process.env.NEWS_API_KEY) {
      sources.push(NEWS_SOURCES.NEWSAPI);
    }
    
    if (process.env.GNEWS_API_KEY) {
      sources.push(NEWS_SOURCES.GNEWS);
    }
    
    if (process.env.MEDIASTACK_API_KEY) {
      sources.push(NEWS_SOURCES.MEDIASTACK);
    }
    
    // If no API keys are available, we'll fall back to web scraping
    
    // Fetch articles from configured sources
    const options = {
      category,
      limit: 20,
      sources
    };
    
    console.log(`Fetching news articles for category: ${category}`);
    const articles = await fetchNewsWithFallback(options);
    
    // Update cache based on category
    if (category === 'all') {
      newsCache.articles = articles;
      newsCache.lastUpdated = new Date().toISOString();
      
      // Clear category cache since we have new data
      newsCache.categories = {};
    } else {
      // If updating a specific category, update that category's cache
      newsCache.categories[category] = {
        articles,
        lastUpdated: new Date().toISOString()
      };
      
      // Also update main cache with these articles if it's empty
      if (newsCache.articles.length === 0) {
        newsCache.articles = articles;
        newsCache.lastUpdated = new Date().toISOString();
      }
    }
    
    // Save to file
    fs.writeFileSync(newsFilePath, JSON.stringify(newsCache, null, 2));
    
    console.log(`Updated news cache with ${articles.length} articles for category: ${category}`);
    return articles;
  } catch (error) {
    console.error(`Error updating news cache for category ${category}:`, error);
    
    // If we have cached data, return it instead of throwing
    if (category === 'all' && newsCache.articles.length > 0) {
      console.log(`Returning ${newsCache.articles.length} cached articles due to update failure`);
      return newsCache.articles;
    } else if (category !== 'all' && newsCache.categories[category]?.articles?.length > 0) {
      console.log(`Returning ${newsCache.categories[category].articles.length} cached ${category} articles due to update failure`);
      return newsCache.categories[category].articles;
    }
    
    // If we have no cached data, generate mock data
    console.log('Generating mock news data as fallback');
    return generateMockNews(category);
  }
};

/**
 * Generate mock news data as a last resort fallback
 * @param {string} category - Category to generate mock news for
 * @returns {Array} Array of mock news articles
 */
const generateMockNews = (category = 'all') => {
  console.log(`Generating mock news for category: ${category}`);
  
  const mockArticles = [
    {
      id: `mock-tech-${Date.now()}-1`,
      title: "AI Models Achieve New Benchmark in Natural Language Understanding",
      summary: "Latest research shows AI models approaching human-level comprehension on complex linguistic tasks",
      content: "Researchers have developed a new generation of language models that demonstrate unprecedented capabilities in understanding context, nuance, and implied meaning in human language. These advancements could revolutionize how we interact with AI systems across various applications.",
      source: "Tech Insights",
      author: "AI Research Team",
      date: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      url: "https://example.com/ai-language-benchmark",
      imageUrl: "https://example.com/images/ai-language.jpg",
      category: "technology",
      provider: "mock"
    },
    {
      id: `mock-env-${Date.now()}-1`,
      title: "New Carbon Capture Technology Shows Promise in Large-Scale Tests",
      summary: "Innovative system removes carbon dioxide from atmosphere at unprecedented rates",
      content: "A breakthrough in carbon capture technology has demonstrated the ability to remove CO2 from the atmosphere at rates significantly higher than previous methods, while requiring less energy. The system, developed by a team of international researchers, could be a game-changer in addressing climate change if deployed at scale.",
      source: "Climate Solutions",
      author: "Environmental Science Division",
      date: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      url: "https://example.com/carbon-capture-breakthrough",
      imageUrl: "https://example.com/images/carbon-capture.jpg",
      category: "environment",
      provider: "mock"
    },
    {
      id: `mock-pol-${Date.now()}-1`,
      title: "Global Summit on Digital Governance Concludes with New Framework",
      summary: "World leaders agree on principles for regulating artificial intelligence and data privacy",
      content: "Representatives from over 40 countries have concluded a landmark summit on digital governance, establishing a new framework for the ethical development and regulation of artificial intelligence technologies. The agreement addresses concerns about privacy, security, and the potential societal impacts of advanced AI systems.",
      source: "World Affairs",
      author: "International Policy Team",
      date: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      url: "https://example.com/digital-governance-summit",
      imageUrl: "https://example.com/images/digital-summit.jpg",
      category: "politics",
      provider: "mock"
    },
    {
      id: `mock-health-${Date.now()}-1`,
      title: "Revolutionary mRNA Technology Applied to Treatment of Chronic Diseases",
      summary: "Researchers adapt vaccine technology to deliver targeted therapies for previously untreatable conditions",
      content: "Building on the success of mRNA vaccines, medical researchers have developed new applications of the technology to treat a range of chronic diseases. Early clinical trials show promising results for conditions including certain autoimmune disorders and metabolic diseases that have traditionally been difficult to address.",
      source: "Health Innovations",
      author: "Medical Research Institute",
      date: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      url: "https://example.com/mrna-chronic-disease",
      imageUrl: "https://example.com/images/mrna-therapy.jpg",
      category: "health",
      provider: "mock"
    },
    {
      id: `mock-bus-${Date.now()}-1`,
      title: "Sustainable Business Practices Drive Record Growth in Green Economy Sector",
      summary: "Companies embracing environmental responsibility outperform market averages",
      content: "A comprehensive analysis of market performance over the past year reveals that companies with strong environmental, social, and governance (ESG) practices have significantly outperformed their peers. The trend suggests a growing recognition of sustainability as a driver of long-term business value rather than simply a compliance requirement.",
      source: "Business Trends",
      author: "Economic Analysis Group",
      date: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      url: "https://example.com/sustainable-business-growth",
      imageUrl: "https://example.com/images/green-business.jpg",
      category: "business",
      provider: "mock"
    }
  ];
  
  // Filter by category if needed
  if (category !== 'all') {
    return mockArticles.filter(article => article.category === category);
  }
  
  return mockArticles;
};

/**
 * Get all latest news articles
 * @param {boolean} forceUpdate - Force update even if cache is recent
 * @returns {Promise<Array>} Array of news articles
 */
const getLatestNews = async (forceUpdate = false) => {
  // Check if cache is older than 1 hour
  const cacheAge = newsCache.lastUpdated 
    ? (new Date() - new Date(newsCache.lastUpdated)) / (1000 * 60 * 60)
    : Infinity;
  
  if (forceUpdate || cacheAge > 1 || newsCache.articles.length === 0) {
    return await updateNewsCache('all', forceUpdate);
  }
  
  return newsCache.articles;
};

/**
 * Get news articles by category
 * @param {string} category - Category name
 * @param {boolean} forceUpdate - Force update even if cache is recent
 * @returns {Promise<Array>} Array of news articles in the category
 */
const getNewsByCategory = async (category, forceUpdate = false) => {
  if (category.toLowerCase() === 'all') {
    return await getLatestNews(forceUpdate);
  }
  
  // Check if we have a category-specific cache and if it's recent
  const categoryCacheAge = newsCache.categories[category]?.lastUpdated
    ? (new Date() - new Date(newsCache.categories[category].lastUpdated)) / (1000 * 60 * 60)
    : Infinity;
  
  // If cache is old or empty or force update is requested, fetch new data
  if (forceUpdate || categoryCacheAge > 1 || !newsCache.categories[category] || newsCache.categories[category].articles.length === 0) {
    return await updateNewsCache(category, forceUpdate);
  }
  
  return newsCache.categories[category].articles;
};

/**
 * Get a single news article by ID
 * @param {string|number} id - Article ID
 * @returns {Promise<Object|null>} News article or null if not found
 */
const getNewsById = async (id) => {
  // First check main cache
  const allNews = await getLatestNews();
  let article = allNews.find(article => article.id.toString() === id.toString());
  
  // If not found, check category caches
  if (!article) {
    for (const category in newsCache.categories) {
      if (newsCache.categories[category]?.articles) {
        article = newsCache.categories[category].articles.find(
          article => article.id.toString() === id.toString()
        );
        if (article) break;
      }
    }
  }
  
  return article || null;
};

/**
 * Force refresh all news caches
 * @returns {Promise<Object>} Status of refresh operation
 */
const refreshAllNews = async () => {
  try {
    // Update main cache
    const mainArticles = await updateNewsCache('all', true);
    
    // Update each category cache
    const categoryPromises = ['technology', 'business', 'health', 'politics', 'environment'].map(
      category => updateNewsCache(category, true)
    );
    
    await Promise.all(categoryPromises);
    
    return {
      success: true,
      mainArticlesCount: mainArticles.length,
      message: 'All news caches refreshed successfully'
    };
  } catch (error) {
    console.error('Error refreshing all news caches:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to refresh all news caches'
    };
  }
};

module.exports = {
  getLatestNews,
  getNewsByCategory,
  getNewsById,
  updateNewsCache,
  refreshAllNews
};
