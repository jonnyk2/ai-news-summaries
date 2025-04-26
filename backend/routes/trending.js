const express = require('express');
const router = express.Router();
const { 
  getTrendingStories, 
  getTrendingStoryById, 
  refreshTrendingStories,
  CATEGORIES 
} = require('../services/trendingNewsService');

/**
 * @route   GET /api/trending
 * @desc    Get all trending stories
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { minSources = 2, category = 'all' } = req.query;
    const stories = await getTrendingStories({ 
      minSources: parseInt(minSources, 10),
      category
    });
    
    res.json(stories);
  } catch (error) {
    console.error('Error fetching trending stories:', error);
    res.status(500).json({ error: 'Failed to fetch trending stories', details: error.message });
  }
});

/**
 * @route   GET /api/trending/categories
 * @desc    Get all available categories
 * @access  Public
 */
router.get('/categories', (req, res) => {
  res.json(CATEGORIES);
});

/**
 * @route   GET /api/trending/:id
 * @desc    Get a single trending story by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const story = await getTrendingStoryById(id);
    
    if (!story) {
      return res.status(404).json({ error: 'Trending story not found' });
    }
    
    res.json(story);
  } catch (error) {
    console.error(`Error fetching trending story ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch trending story', details: error.message });
  }
});

/**
 * @route   GET /api/trending/category/:category
 * @desc    Get trending stories by category
 * @access  Public
 */
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { minSources = 2 } = req.query;
    
    const stories = await getTrendingStories({ 
      minSources: parseInt(minSources, 10),
      category
    });
    
    res.json(stories);
  } catch (error) {
    console.error(`Error fetching ${req.params.category} trending stories:`, error);
    res.status(500).json({ error: 'Failed to fetch trending stories by category', details: error.message });
  }
});

/**
 * @route   POST /api/trending/refresh
 * @desc    Force refresh trending stories
 * @access  Public
 */
router.post('/refresh', async (req, res) => {
  try {
    const result = await refreshTrendingStories();
    res.json(result);
  } catch (error) {
    console.error('Error refreshing trending stories:', error);
    res.status(500).json({ error: 'Failed to refresh trending stories', details: error.message });
  }
});

module.exports = router;
