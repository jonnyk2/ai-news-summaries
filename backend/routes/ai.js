const express = require('express');
const router = express.Router();
const { 
  getOpenAIAnalysis,
  getClaudeAnalysis,
  getGeminiAnalysis,
  getCopilotAnalysis,
  getDeepSeekAnalysis,
  getCohereAnalysis
} = require('../services/aiService');

/**
 * @route   POST /api/ai/analyze
 * @desc    Get analysis from multiple AI models for a news article
 * @access  Public
 */
router.post('/analyze', async (req, res) => {
  try {
    const { newsArticle, aiModels } = req.body;
    
    if (!newsArticle || !aiModels || !Array.isArray(aiModels) || aiModels.length === 0) {
      return res.status(400).json({ error: 'Invalid request. Please provide newsArticle and aiModels array.' });
    }
    
    // Process each AI model in parallel
    const analysisPromises = aiModels.map(async (modelId) => {
      let analysis = null;
      
      try {
        switch (modelId) {
          case 'chatgpt':
            analysis = await getOpenAIAnalysis(newsArticle);
            break;
          case 'claude':
            analysis = await getClaudeAnalysis(newsArticle);
            break;
          case 'gemini':
            analysis = await getGeminiAnalysis(newsArticle);
            break;
          case 'copilot':
            analysis = await getCopilotAnalysis(newsArticle);
            break;
          case 'deepseek':
            analysis = await getDeepSeekAnalysis(newsArticle);
            break;
          case 'cohere':
            analysis = await getCohereAnalysis(newsArticle);
            break;
          default:
            // For other AIs, use a fallback or mock response for now
            analysis = `Analysis from ${modelId} is not yet implemented.`;
        }
      } catch (error) {
        console.error(`Error getting analysis from ${modelId}:`, error);
        analysis = `Error getting analysis from ${modelId}.`;
      }
      
      return { modelId, analysis };
    });
    
    const results = await Promise.all(analysisPromises);
    
    // Convert array of results to an object keyed by modelId
    const analysisResults = results.reduce((acc, { modelId, analysis }) => {
      acc[modelId] = analysis;
      return acc;
    }, {});
    
    res.json(analysisResults);
  } catch (error) {
    console.error('Error analyzing news article:', error);
    res.status(500).json({ error: 'Failed to analyze news article' });
  }
});

/**
 * @route   POST /api/ai/:modelId/analyze
 * @desc    Get analysis from a specific AI model for a news article
 * @access  Public
 */
router.post('/:modelId/analyze', async (req, res) => {
  try {
    const { modelId } = req.params;
    const { newsArticle } = req.body;
    
    if (!newsArticle) {
      return res.status(400).json({ error: 'Invalid request. Please provide newsArticle.' });
    }
    
    let analysis = null;
    
    switch (modelId) {
      case 'chatgpt':
        analysis = await getOpenAIAnalysis(newsArticle);
        break;
      case 'claude':
        analysis = await getClaudeAnalysis(newsArticle);
        break;
      case 'gemini':
        analysis = await getGeminiAnalysis(newsArticle);
        break;
      case 'copilot':
        analysis = await getCopilotAnalysis(newsArticle);
        break;
      case 'deepseek':
        analysis = await getDeepSeekAnalysis(newsArticle);
        break;
      case 'cohere':
        analysis = await getCohereAnalysis(newsArticle);
        break;
      default:
        return res.status(404).json({ error: `AI model ${modelId} not found or not supported.` });
    }
    
    res.json({ modelId, analysis });
  } catch (error) {
    console.error(`Error getting analysis from ${req.params.modelId}:`, error);
    res.status(500).json({ error: `Failed to get analysis from ${req.params.modelId}` });
  }
});

module.exports = router;
