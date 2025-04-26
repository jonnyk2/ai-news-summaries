const express = require('express');
const router = express.Router();
const { getLatestNews, getNewsByCategory, getNewsById, refreshAllNews, updateNewsCache } = require('../services/newsService');

/**
 * @route   GET /api/news
 * @desc    Get all latest news articles
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const news = await getLatestNews();
    res.json(news);
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({ error: 'Failed to fetch news articles' });
  }
});

/**
 * @route   GET /api/news/category/:category
 * @desc    Get news articles by category
 * @access  Public
 */
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const news = await getNewsByCategory(category);
    res.json(news);
  } catch (error) {
    console.error(`Error fetching ${req.params.category} news:`, error);
    res.status(500).json({ error: 'Failed to fetch news articles by category' });
  }
});

/**
 * @route   GET /api/news/:id
 * @desc    Get a single news article by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const newsArticle = await getNewsById(id);
    
    if (!newsArticle) {
      return res.status(404).json({ error: 'News article not found' });
    }
    
    res.json(newsArticle);
  } catch (error) {
    console.error(`Error fetching news article ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch news article' });
  }
});

/**
 * @route   POST /api/news/refresh
 * @desc    Force refresh all news caches
 * @access  Public
 */
router.post('/refresh', async (req, res) => {
  try {
    const result = await refreshAllNews();
    res.json(result);
  } catch (error) {
    console.error('Error refreshing news caches:', error);
    res.status(500).json({ error: 'Failed to refresh news caches', details: error.message });
  }
});

/**
 * @route   GET /api/news/test-sources
 * @desc    Test fetching from different news sources
 * @access  Public
 */
router.get('/test-sources', async (req, res) => {
  try {
    const { category = 'technology', forceUpdate = true } = req.query;
    
    console.log(`Testing news sources for category: ${category}`);
    const articles = await updateNewsCache(category, forceUpdate === 'true');
    
    res.json({
      success: true,
      count: articles.length,
      category,
      articles: articles.slice(0, 3), // Return just the first 3 articles to keep response size reasonable
      sources: articles.reduce((acc, article) => {
        if (article.provider && !acc.includes(article.provider)) {
          acc.push(article.provider);
        }
        return acc;
      }, [])
    });
  } catch (error) {
    console.error('Error testing news sources:', error);
    res.status(500).json({ error: 'Failed to test news sources', details: error.message });
  }
});

module.exports = router;
