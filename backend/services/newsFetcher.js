/**
 * News Fetcher Service
 * Handles fetching news from multiple external API sources with fallback mechanisms
 */
const axios = require('axios');
const cheerio = require('cheerio');

// News API sources configuration
const NEWS_SOURCES = {
  NEWSAPI: 'newsapi',
  GNEWS: 'gnews',
  MEDIASTACK: 'mediastack',
  CURRENTS: 'currents',
  NEWSCATCHER: 'newscatcher'
};

/**
 * Fetch news from NewsAPI.org
 * @param {Object} options - Options for fetching news
 * @param {string} options.category - News category
 * @param {number} options.limit - Number of articles to fetch
 * @returns {Promise<Array>} Array of news articles
 */
const fetchFromNewsAPI = async (options = {}) => {
  try {
    const apiKey = process.env.NEWS_API_KEY;
    
    if (!apiKey) {
      throw new Error('NEWS_API_KEY is not defined in environment variables');
    }
    
    const params = {
      apiKey,
      country: options.country || 'us',
      pageSize: options.limit || 20
    };
    
    // Add category if specified and not 'all'
    if (options.category && options.category !== 'all') {
      params.category = mapCategoryToNewsAPI(options.category);
    }
    
    const response = await axios.get('https://newsapi.org/v2/top-headlines', { params });
    
    if (response.data.status !== 'ok') {
      throw new Error(`NewsAPI error: ${response.data.message || 'Unknown error'}`);
    }
    
    // Transform the API response to our standardized format
    return response.data.articles.map((article, index) => ({
      id: `newsapi-${Date.now()}-${index}`,
      title: article.title,
      summary: article.description,
      content: article.content,
      source: article.source.name,
      author: article.author,
      date: new Date(article.publishedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      url: article.url,
      imageUrl: article.urlToImage,
      category: options.category || determineCategoryFromArticle(article),
      provider: NEWS_SOURCES.NEWSAPI
    }));
  } catch (error) {
    console.error('Error fetching from NewsAPI:', error.message);
    throw error;
  }
};

/**
 * Fetch news from GNews API
 * @param {Object} options - Options for fetching news
 * @param {string} options.category - News category
 * @param {number} options.limit - Number of articles to fetch
 * @returns {Promise<Array>} Array of news articles
 */
const fetchFromGNews = async (options = {}) => {
  try {
    const apiKey = process.env.GNEWS_API_KEY;
    
    if (!apiKey) {
      throw new Error('GNEWS_API_KEY is not defined in environment variables');
    }
    
    const params = {
      token: apiKey,
      country: options.country || 'us',
      max: options.limit || 20,
      lang: 'en'
    };
    
    // Add topic if specified and not 'all'
    if (options.category && options.category !== 'all') {
      params.topic = mapCategoryToGNews(options.category);
    }
    
    const url = options.category && options.category !== 'all' 
      ? 'https://gnews.io/api/v4/top-headlines' 
      : 'https://gnews.io/api/v4/search?q=top%20news';
    
    const response = await axios.get(url, { params });
    
    if (!response.data.articles) {
      throw new Error(`GNews API error: ${response.data.errors || 'Unknown error'}`);
    }
    
    // Transform the API response to our standardized format
    return response.data.articles.map((article, index) => ({
      id: `gnews-${Date.now()}-${index}`,
      title: article.title,
      summary: article.description,
      content: article.content,
      source: article.source.name,
      author: null, // GNews doesn't provide author information
      date: new Date(article.publishedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      url: article.url,
      imageUrl: article.image,
      category: options.category || determineCategoryFromArticle(article),
      provider: NEWS_SOURCES.GNEWS
    }));
  } catch (error) {
    console.error('Error fetching from GNews:', error.message);
    throw error;
  }
};

/**
 * Fetch news from MediaStack API
 * @param {Object} options - Options for fetching news
 * @param {string} options.category - News category
 * @param {number} options.limit - Number of articles to fetch
 * @returns {Promise<Array>} Array of news articles
 */
const fetchFromMediaStack = async (options = {}) => {
  try {
    const apiKey = process.env.MEDIASTACK_API_KEY;
    
    if (!apiKey) {
      throw new Error('MEDIASTACK_API_KEY is not defined in environment variables');
    }
    
    const params = {
      access_key: apiKey,
      countries: options.country || 'us',
      limit: options.limit || 20,
      languages: 'en',
      sort: 'published_desc'
    };
    
    // Add category if specified and not 'all'
    if (options.category && options.category !== 'all') {
      params.categories = mapCategoryToMediaStack(options.category);
    }
    
    const response = await axios.get('http://api.mediastack.com/v1/news', { params });
    
    if (!response.data.data) {
      throw new Error(`MediaStack API error: ${response.data.error?.info || 'Unknown error'}`);
    }
    
    // Transform the API response to our standardized format
    return response.data.data.map((article, index) => ({
      id: `mediastack-${Date.now()}-${index}`,
      title: article.title,
      summary: article.description,
      content: article.description, // MediaStack doesn't provide full content
      source: article.source,
      author: article.author,
      date: new Date(article.published_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      url: article.url,
      imageUrl: article.image,
      category: article.category || options.category || 'general',
      provider: NEWS_SOURCES.MEDIASTACK
    }));
  } catch (error) {
    console.error('Error fetching from MediaStack:', error.message);
    throw error;
  }
};

/**
 * Scrape news from a website using cheerio
 * @param {string} url - URL to scrape
 * @param {Object} selectors - CSS selectors for different elements
 * @param {string} category - News category
 * @returns {Promise<Array>} Array of news articles
 */
const scrapeNewsWebsite = async (url, selectors, category = 'general') => {
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    const articles = [];
    
    $(selectors.articleContainer).each((index, element) => {
      if (index >= 10) return false; // Limit to 10 articles
      
      const $element = $(element);
      const title = $element.find(selectors.title).text().trim();
      const summary = $element.find(selectors.summary).text().trim();
      const link = new URL($element.find(selectors.link).attr('href'), url).toString();
      const imageUrl = $element.find(selectors.image).attr('src');
      
      // Only add if we have at least a title and link
      if (title && link) {
        articles.push({
          id: `scrape-${Date.now()}-${index}`,
          title,
          summary,
          content: summary,
          source: new URL(url).hostname.replace('www.', ''),
          author: null,
          date: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          url: link,
          imageUrl,
          category,
          provider: 'scrape'
        });
      }
    });
    
    return articles;
  } catch (error) {
    console.error(`Error scraping news from ${url}:`, error.message);
    return []; // Return empty array instead of throwing
  }
};

/**
 * Fetch news from multiple sources with fallback
 * @param {Object} options - Options for fetching news
 * @param {string} options.category - News category
 * @param {number} options.limit - Number of articles to fetch
 * @param {Array<string>} options.sources - Array of news sources to try
 * @returns {Promise<Array>} Array of news articles
 */
const fetchNewsWithFallback = async (options = {}) => {
  const sources = options.sources || [
    NEWS_SOURCES.NEWSAPI,
    NEWS_SOURCES.GNEWS,
    NEWS_SOURCES.MEDIASTACK
  ];
  
  let articles = [];
  let errors = [];
  
  // Try each source in order until we get results
  for (const source of sources) {
    try {
      switch (source) {
        case NEWS_SOURCES.NEWSAPI:
          articles = await fetchFromNewsAPI(options);
          break;
        case NEWS_SOURCES.GNEWS:
          articles = await fetchFromGNews(options);
          break;
        case NEWS_SOURCES.MEDIASTACK:
          articles = await fetchFromMediaStack(options);
          break;
        default:
          throw new Error(`Unknown news source: ${source}`);
      }
      
      // If we got articles, break out of the loop
      if (articles.length > 0) {
        console.log(`Successfully fetched ${articles.length} articles from ${source}`);
        break;
      }
    } catch (error) {
      errors.push({ source, message: error.message });
      console.error(`Error fetching from ${source}, trying next source...`);
    }
  }
  
  // If we couldn't get articles from any API, try scraping as a last resort
  if (articles.length === 0) {
    console.log('All API sources failed, trying web scraping as fallback...');
    
    try {
      // Try to scrape news from a reliable source based on category
      const scrapeSources = getScrapeSources(options.category);
      
      for (const { url, selectors, category } of scrapeSources) {
        const scrapedArticles = await scrapeNewsWebsite(url, selectors, category);
        
        if (scrapedArticles.length > 0) {
          articles = scrapedArticles;
          console.log(`Successfully scraped ${articles.length} articles from ${url}`);
          break;
        }
      }
    } catch (error) {
      errors.push({ source: 'scraping', message: error.message });
      console.error('Error during web scraping fallback:', error.message);
    }
  }
  
  // If we still have no articles, throw an error with details
  if (articles.length === 0) {
    const errorMessage = `Failed to fetch news from all sources: ${JSON.stringify(errors)}`;
    throw new Error(errorMessage);
  }
  
  return articles;
};

/**
 * Map our category to NewsAPI category
 * @param {string} category - Our internal category
 * @returns {string} NewsAPI category
 */
const mapCategoryToNewsAPI = (category) => {
  const mapping = {
    'technology': 'technology',
    'business': 'business',
    'health': 'health',
    'politics': 'politics',
    'environment': 'science',
    'general': 'general'
  };
  
  return mapping[category.toLowerCase()] || 'general';
};

/**
 * Map our category to GNews category
 * @param {string} category - Our internal category
 * @returns {string} GNews category
 */
const mapCategoryToGNews = (category) => {
  const mapping = {
    'technology': 'technology',
    'business': 'business',
    'health': 'health',
    'politics': 'world',
    'environment': 'science',
    'general': 'general'
  };
  
  return mapping[category.toLowerCase()] || 'general';
};

/**
 * Map our category to MediaStack category
 * @param {string} category - Our internal category
 * @returns {string} MediaStack category
 */
const mapCategoryToMediaStack = (category) => {
  const mapping = {
    'technology': 'technology',
    'business': 'business',
    'health': 'health',
    'politics': 'general',
    'environment': 'science',
    'general': 'general'
  };
  
  return mapping[category.toLowerCase()] || 'general';
};

/**
 * Get scrape sources based on category
 * @param {string} category - News category
 * @returns {Array} Array of scrape sources with selectors
 */
const getScrapeSources = (category = 'general') => {
  const sources = [];
  
  // Technology news sources
  if (category === 'technology' || category === 'all') {
    sources.push({
      url: 'https://techcrunch.com/',
      selectors: {
        articleContainer: 'article.post-block',
        title: 'h2.post-block__title a',
        summary: 'div.post-block__content',
        link: 'h2.post-block__title a',
        image: 'img.post-block__media'
      },
      category: 'technology'
    });
  }
  
  // Business news sources
  if (category === 'business' || category === 'all') {
    sources.push({
      url: 'https://www.cnbc.com/business/',
      selectors: {
        articleContainer: 'div.Card-standardBreakerCard',
        title: 'a.Card-title',
        summary: 'div.Card-description',
        link: 'a.Card-title',
        image: 'img.Card-img'
      },
      category: 'business'
    });
  }
  
  // General news sources (fallback for all categories)
  sources.push({
    url: 'https://www.reuters.com/',
    selectors: {
      articleContainer: 'article.story',
      title: 'h3.story-title',
      summary: 'p.story-description',
      link: 'a.story-link',
      image: 'img.story-image'
    },
    category: category === 'all' ? 'general' : category
  });
  
  return sources;
};

/**
 * Determine category based on article content
 * @param {Object} article - The news article
 * @returns {string} Category name
 */
const determineCategoryFromArticle = (article) => {
  const title = (article.title || '').toLowerCase();
  const description = (article.description || '').toLowerCase();
  const content = (article.content || '').toLowerCase();
  
  const text = `${title} ${description} ${content}`;
  
  // Simple keyword-based categorization
  if (text.includes('tech') || text.includes('ai') || text.includes('robot') || 
      text.includes('computer') || text.includes('software') || text.includes('digital') ||
      text.includes('quantum') || text.includes('cyber')) {
    return 'technology';
  }
  
  if (text.includes('climate') || text.includes('environment') || text.includes('renewable') || 
      text.includes('carbon') || text.includes('emission') || text.includes('sustainable') ||
      text.includes('green energy') || text.includes('biodiversity')) {
    return 'environment';
  }
  
  if (text.includes('politic') || text.includes('government') || text.includes('election') || 
      text.includes('president') || text.includes('congress') || text.includes('senate') ||
      text.includes('democrat') || text.includes('republican')) {
    return 'politics';
  }
  
  if (text.includes('health') || text.includes('medical') || text.includes('disease') || 
      text.includes('doctor') || text.includes('patient') || text.includes('hospital') ||
      text.includes('treatment') || text.includes('vaccine')) {
    return 'health';
  }
  
  if (text.includes('business') || text.includes('economy') || text.includes('market') || 
      text.includes('stock') || text.includes('investor') || text.includes('company') ||
      text.includes('financial') || text.includes('trade')) {
    return 'business';
  }
  
  return 'general';
};

module.exports = {
  fetchNewsWithFallback,
  fetchFromNewsAPI,
  fetchFromGNews,
  fetchFromMediaStack,
  scrapeNewsWebsite,
  NEWS_SOURCES
};
