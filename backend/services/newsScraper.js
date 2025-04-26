const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// Path to store news data
const dataDir = path.join(__dirname, '../data');
const newsFilePath = path.join(dataDir, 'news.json');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// News sources to scrape
const NEWS_SOURCES = [
  {
    name: 'Reuters Technology',
    url: 'https://www.reuters.com/technology/',
    category: 'technology',
    selector: 'article',
    titleSelector: 'h3',
    summarySelector: 'p',
    linkSelector: 'a',
    baseUrl: 'https://www.reuters.com'
  },
  {
    name: 'BBC Science & Environment',
    url: 'https://www.bbc.com/news/science_and_environment',
    category: 'environment',
    selector: '.gs-c-promo',
    titleSelector: '.gs-c-promo-heading__title',
    summarySelector: '.gs-c-promo-summary',
    linkSelector: 'a',
    baseUrl: 'https://www.bbc.com'
  },
  {
    name: 'NPR Politics',
    url: 'https://www.npr.org/sections/politics/',
    category: 'politics',
    selector: '.item.has-image',
    titleSelector: 'h2',
    summarySelector: 'p',
    linkSelector: 'a',
    baseUrl: ''
  },
  {
    name: 'CNN Health',
    url: 'https://www.cnn.com/health',
    category: 'health',
    selector: '.card',
    titleSelector: '.card-title',
    summarySelector: '.card-text',
    linkSelector: 'a',
    baseUrl: 'https://www.cnn.com'
  },
  {
    name: 'CNBC Business',
    url: 'https://www.cnbc.com/business/',
    category: 'business',
    selector: '.Card-standardBreakerCard',
    titleSelector: '.Card-title',
    summarySelector: '.Card-description',
    linkSelector: 'a',
    baseUrl: ''
  }
];

/**
 * Scrape news articles from a specific source
 * @param {Object} source News source configuration
 * @returns {Promise<Array>} Array of scraped news articles
 */
const scrapeNewsSource = async (source) => {
  try {
    console.log(`Scraping news from ${source.name}...`);
    
    const response = await axios.get(source.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const $ = cheerio.load(response.data);
    const articles = [];
    
    $(source.selector).each((index, element) => {
      if (index >= 10) return false; // Limit to 10 articles per source
      
      const titleElement = $(element).find(source.titleSelector).first();
      const summaryElement = $(element).find(source.summarySelector).first();
      const linkElement = $(element).find(source.linkSelector).first();
      
      const title = titleElement.text().trim();
      const summary = summaryElement.text().trim();
      let url = linkElement.attr('href');
      
      // Skip if no title or already processed
      if (!title || articles.some(a => a.title === title)) return;
      
      // Handle relative URLs
      if (url && url.startsWith('/')) {
        url = source.baseUrl + url;
      }
      
      articles.push({
        id: Date.now() + index + Math.floor(Math.random() * 1000),
        title,
        summary: summary || 'No summary available',
        source: source.name,
        date: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        url,
        category: source.category
      });
    });
    
    console.log(`Scraped ${articles.length} articles from ${source.name}`);
    return articles;
  } catch (error) {
    console.error(`Error scraping ${source.name}:`, error);
    return [];
  }
};

/**
 * Scrape latest news from all configured sources
 * @returns {Promise<Array>} Combined array of news articles
 */
const scrapeLatestNews = async () => {
  try {
    // Scrape all sources in parallel
    const scrapePromises = NEWS_SOURCES.map(source => scrapeNewsSource(source));
    const results = await Promise.all(scrapePromises);
    
    // Combine and flatten results
    const allArticles = results.flat();
    
    // Read existing news data
    let existingData = { articles: [], lastUpdated: null };
    if (fs.existsSync(newsFilePath)) {
      try {
        const data = fs.readFileSync(newsFilePath, 'utf8');
        existingData = JSON.parse(data);
      } catch (err) {
        console.error('Error reading existing news data:', err);
      }
    }
    
    // Merge with existing data, avoiding duplicates
    const existingTitles = new Set(existingData.articles.map(a => a.title));
    const newArticles = allArticles.filter(article => !existingTitles.has(article.title));
    
    // Combine and limit to 50 most recent articles
    const combinedArticles = [...newArticles, ...existingData.articles]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 50);
    
    // Update news data
    const updatedData = {
      articles: combinedArticles,
      lastUpdated: new Date().toISOString()
    };
    
    // Save to file
    fs.writeFileSync(newsFilePath, JSON.stringify(updatedData, null, 2));
    
    console.log(`Scraped a total of ${newArticles.length} new articles`);
    return combinedArticles;
  } catch (error) {
    console.error('Error in scrapeLatestNews:', error);
    throw error;
  }
};

module.exports = {
  scrapeLatestNews,
  scrapeNewsSource
};
