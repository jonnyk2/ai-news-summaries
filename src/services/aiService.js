import axios from 'axios';

/**
 * Get analysis from multiple AI models for a news article
 * @param {Object} newsArticle News article object
 * @param {Array<string>} aiModels Array of AI model IDs
 * @returns {Promise<Object>} Object with AI model IDs as keys and analysis text as values
 */
export const getAIAnalysis = async (newsArticle, aiModels) => {
  try {
    const response = await axios.post('/api/ai/analyze', {
      newsArticle,
      aiModels
    });
    return response.data;
  } catch (error) {
    console.error('Error getting AI analysis:', error);
    throw error;
  }
};

/**
 * Get analysis from a specific AI model for a news article
 * @param {string} modelId AI model ID
 * @param {Object} newsArticle News article object
 * @returns {Promise<Object>} Object with modelId and analysis
 */
export const getAIModelAnalysis = async (modelId, newsArticle) => {
  try {
    const response = await axios.post(`/api/ai/${modelId}/analyze`, {
      newsArticle
    });
    return response.data;
  } catch (error) {
    console.error(`Error getting analysis from ${modelId}:`, error);
    throw error;
  }
};
