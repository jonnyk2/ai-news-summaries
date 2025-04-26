/**
 * Trending News Service
 * Identifies trending stories that are covered by multiple news outlets
 */
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// Cache file for trending stories
const dataDir = path.join(__dirname, '../data');
const trendingCachePath = path.join(dataDir, 'trending-news.json');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// News sources to scrape
const NEWS_SOURCES = [
  {
    name: 'CNN',
    url: 'https://www.cnn.com',
    selectors: {
      headlines: '.container_lead-plus-headlines__headline, .card__headline',
      links: 'a',
      title: '',
      summary: '.container__text-wrapper'
    }
  },
  {
    name: 'BBC',
    url: 'https://www.bbc.com/news',
    selectors: {
      headlines: '.gs-c-promo-heading',
      links: 'a',
      title: '',
      summary: '.gs-c-promo-summary'
    }
  },
  {
    name: 'Reuters',
    url: 'https://www.reuters.com',
    selectors: {
      headlines: '.media-story-card__body__3tRWy',
      links: 'a.media-story-card__heading__eqhp9',
      title: '.media-story-card__heading__eqhp9',
      summary: '.media-story-card__description__27vSx'
    }
  },
  {
    name: 'AP News',
    url: 'https://apnews.com',
    selectors: {
      headlines: '.PagePromo-title, .CardHeadline',
      links: 'a',
      title: '',
      summary: '.PagePromo-description, .CardDescription'
    }
  },
  {
    name: 'Al Jazeera',
    url: 'https://www.aljazeera.com',
    selectors: {
      headlines: '.gc__title, .fte-article__title',
      links: 'a',
      title: '',
      summary: '.gc__excerpt, .fte-article__excerpt'
    }
  },
  {
    name: 'The Guardian',
    url: 'https://www.theguardian.com/us',
    selectors: {
      headlines: '.fc-item__title, .dcr-12fpzem',
      links: 'a',
      title: '',
      summary: '.fc-item__standfirst, .dcr-1989ovb'
    }
  },
  {
    name: 'NPR',
    url: 'https://www.npr.org/sections/news/',
    selectors: {
      headlines: '.title, .storytitle',
      links: 'a',
      title: '',
      summary: '.teaser, .storydescription'
    }
  },
  {
    name: 'CNBC',
    url: 'https://www.cnbc.com',
    selectors: {
      headlines: '.Card-title, .RiverHeadline-headline',
      links: 'a',
      title: '',
      summary: '.Card-description, .RiverHeadline-description'
    }
  },
  {
    name: 'Fox News',
    url: 'https://www.foxnews.com',
    selectors: {
      headlines: '.title, .article-list__article__headline',
      links: 'a',
      title: '',
      summary: '.content, .article-list__article__dek'
    }
  },
  {
    name: 'The New York Times',
    url: 'https://www.nytimes.com',
    selectors: {
      headlines: 'h2, h3, .indicate-hover',
      links: 'a',
      title: '',
      summary: 'p, .summary'
    }
  }
];

// Categories to classify stories into
const CATEGORIES = ['politics', 'technology', 'business', 'health', 'environment', 'general'];

/**
 * Scrape headlines from a news source
 * @param {Object} source - News source configuration
 * @returns {Promise<Array>} Array of headlines with metadata
 */
const scrapeHeadlines = async (source) => {
  try {
    console.log(`Scraping headlines from ${source.name}...`);
    const response = await axios.get(source.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000
    });
    
    const $ = cheerio.load(response.data);
    const headlines = [];
    
    $(source.selectors.headlines).each((index, element) => {
      try {
        const $element = $(element);
        let title = source.selectors.title ? $element.find(source.selectors.title).text().trim() : $element.text().trim();
        let summary = '';
        let link = '';
        
        // Extract summary if available
        if (source.selectors.summary) {
          const $summary = $element.find(source.selectors.summary);
          if ($summary.length) {
            summary = $summary.text().trim();
          } else {
            // Try to find a nearby summary element
            const $nextElement = $element.next();
            if ($nextElement.is('p') || $nextElement.hasClass('summary') || $nextElement.hasClass('description')) {
              summary = $nextElement.text().trim();
            }
          }
        }
        
        // Extract link
        const $link = source.selectors.links ? $element.find(source.selectors.links) : $element;
        if ($link.is('a')) {
          link = $link.attr('href');
        } else {
          const $a = $link.find('a').first();
          if ($a.length) {
            link = $a.attr('href');
          }
        }
        
        // Ensure link is absolute
        if (link && !link.startsWith('http')) {
          link = new URL(link, source.url).toString();
        }
        
        // Only add if we have at least a title and link
        if (title && link) {
          headlines.push({
            title,
            summary,
            link,
            source: source.name,
            sourceUrl: source.url,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error(`Error processing headline from ${source.name}:`, error.message);
      }
    });
    
    console.log(`Scraped ${headlines.length} headlines from ${source.name}`);
    return headlines;
  } catch (error) {
    console.error(`Error scraping ${source.name}:`, error.message);
    return [];
  }
};

/**
 * Calculate similarity between two headlines
 * Uses a simple Jaccard similarity on the words
 * @param {string} headline1 - First headline
 * @param {string} headline2 - Second headline
 * @returns {number} Similarity score between 0 and 1
 */
const calculateSimilarity = (headline1, headline2) => {
  // Simple preprocessing: lowercase, remove punctuation, split into words
  const processText = (text) => {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3); // Filter out short words
  };
  
  const words1 = new Set(processText(headline1));
  const words2 = new Set(processText(headline2));
  
  // No meaningful comparison possible with very short texts
  if (words1.size < 2 || words2.size < 2) {
    return 0;
  }
  
  // Calculate Jaccard similarity: intersection size / union size
  const intersection = new Set([...words1].filter(word => words2.has(word)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
};

/**
 * Determine category of a story based on its content
 * @param {Object} story - Story object with title and summary
 * @returns {string} Category name
 */
const determineCategory = (story) => {
  const text = `${story.title} ${story.summary}`.toLowerCase();
  
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

/**
 * Cluster similar headlines together
 * @param {Array} headlines - Array of headline objects
 * @param {number} similarityThreshold - Threshold for considering headlines similar (0-1)
 * @returns {Array} Array of clusters, each containing similar headlines
 */
const clusterSimilarHeadlines = (headlines, similarityThreshold = 0.35) => {
  const clusters = [];
  
  // Process each headline
  headlines.forEach(headline => {
    // Try to find a matching cluster
    let foundCluster = false;
    
    for (const cluster of clusters) {
      // Compare with the first headline in the cluster as a representative
      const similarity = calculateSimilarity(headline.title, cluster.headlines[0].title);
      
      if (similarity >= similarityThreshold) {
        cluster.headlines.push(headline);
        cluster.sources.add(headline.source);
        foundCluster = true;
        break;
      }
    }
    
    // If no matching cluster, create a new one
    if (!foundCluster) {
      clusters.push({
        headlines: [headline],
        sources: new Set([headline.source]),
        category: determineCategory(headline)
      });
    }
  });
  
  // Process clusters to add metadata
  return clusters.map(cluster => ({
    title: findBestTitle(cluster.headlines),
    headlines: cluster.headlines,
    sourceCount: cluster.sources.size,
    sources: Array.from(cluster.sources),
    category: cluster.category
  }));
};

/**
 * Find the best title from a cluster of headlines
 * Prefers longer, more informative titles
 * @param {Array} headlines - Array of headline objects
 * @returns {string} Best title
 */
const findBestTitle = (headlines) => {
  // Sort by length (prefer longer, more informative titles)
  // But not too long (avoid clickbait)
  const sortedHeadlines = [...headlines].sort((a, b) => {
    const aLength = a.title.length;
    const bLength = b.title.length;
    
    // Penalize very short and very long titles
    const aScore = aLength < 20 ? aLength : (aLength > 100 ? 200 - aLength : aLength);
    const bScore = bLength < 20 ? bLength : (bLength > 100 ? 200 - bLength : bLength);
    
    return bScore - aScore;
  });
  
  return sortedHeadlines[0].title;
};

/**
 * Get trending stories across multiple news sources
 * @param {Object} options - Options for fetching trending stories
 * @param {number} options.minSources - Minimum number of sources that must cover a story (default: 2)
 * @param {string} options.category - Category to filter by (optional)
 * @param {boolean} options.forceRefresh - Force refresh the cache (default: false)
 * @returns {Promise<Array>} Array of trending stories
 */
const getTrendingStories = async (options = {}) => {
  const { minSources = 2, category, forceRefresh = false } = options;
  
  // Check if we have a recent cache (less than 1 hour old)
  let trendingCache = { stories: [], lastUpdated: null };
  
  try {
    if (fs.existsSync(trendingCachePath) && !forceRefresh) {
      const data = fs.readFileSync(trendingCachePath, 'utf8');
      trendingCache = JSON.parse(data);
      
      const cacheAge = (new Date() - new Date(trendingCache.lastUpdated)) / (1000 * 60 * 60);
      
      if (cacheAge < 1 && trendingCache.stories.length > 0) {
        console.log(`Using cached trending stories (${cacheAge.toFixed(2)} hours old)`);
        
        // Filter by category if needed
        if (category && category !== 'all') {
          return trendingCache.stories.filter(story => story.category === category);
        }
        
        return trendingCache.stories;
      }
    }
  } catch (error) {
    console.error('Error reading trending cache:', error);
  }
  
  // Scrape headlines from all sources
  const allHeadlinesPromises = NEWS_SOURCES.map(source => scrapeHeadlines(source));
  const headlinesArrays = await Promise.all(allHeadlinesPromises);
  
  // Flatten the arrays
  const allHeadlines = headlinesArrays.flat();
  console.log(`Scraped ${allHeadlines.length} total headlines from ${NEWS_SOURCES.length} sources`);
  
  // Cluster similar headlines
  const clusters = clusterSimilarHeadlines(allHeadlines);
  console.log(`Formed ${clusters.length} clusters of similar headlines`);
  
  // Filter clusters by minimum source count and sort by source count (descending)
  const trendingStories = clusters
    .filter(cluster => cluster.sourceCount >= minSources)
    .sort((a, b) => b.sourceCount - a.sourceCount)
    .map((cluster, index) => ({
      id: `trending-${Date.now()}-${index}`,
      title: cluster.title,
      summary: cluster.headlines[0].summary || '',
      category: cluster.category,
      sourceCount: cluster.sourceCount,
      sources: cluster.sources,
      perspectives: cluster.headlines.map(h => ({
        source: h.source,
        title: h.title,
        summary: h.summary,
        link: h.link
      }))
    }));
  
  console.log(`Found ${trendingStories.length} trending stories covered by at least ${minSources} sources`);
  
  // Update cache
  trendingCache = {
    stories: trendingStories,
    lastUpdated: new Date().toISOString()
  };
  
  // Save to file
  try {
    fs.writeFileSync(trendingCachePath, JSON.stringify(trendingCache, null, 2));
    console.log('Updated trending stories cache');
  } catch (error) {
    console.error('Error saving trending cache:', error);
  }
  
  // Filter by category if needed
  if (category && category !== 'all') {
    return trendingStories.filter(story => story.category === category);
  }
  
  return trendingStories;
};

/**
 * Get a single trending story by ID
 * @param {string} id - Story ID
 * @returns {Promise<Object|null>} Trending story or null if not found
 */
const getTrendingStoryById = async (id) => {
  try {
    if (fs.existsSync(trendingCachePath)) {
      const data = fs.readFileSync(trendingCachePath, 'utf8');
      const trendingCache = JSON.parse(data);
      
      return trendingCache.stories.find(story => story.id === id) || null;
    }
  } catch (error) {
    console.error('Error reading trending cache:', error);
  }
  
  return null;
};

/**
 * Force refresh trending stories
 * @returns {Promise<Object>} Status of refresh operation
 */
const refreshTrendingStories = async () => {
  try {
    const stories = await getTrendingStories({ forceRefresh: true });
    
    return {
      success: true,
      count: stories.length,
      message: 'Trending stories refreshed successfully'
    };
  } catch (error) {
    console.error('Error refreshing trending stories:', error);
    
    return {
      success: false,
      error: error.message,
      message: 'Failed to refresh trending stories'
    };
  }
};

module.exports = {
  getTrendingStories,
  getTrendingStoryById,
  refreshTrendingStories,
  CATEGORIES
};
