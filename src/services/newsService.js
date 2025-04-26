import axios from 'axios';

/**
 * Fetch all latest news articles
 * @returns {Promise<Array>} Array of news articles
 */
export const fetchLatestNews = async () => {
  try {
    const response = await axios.get('/api/news');
    return response.data;
  } catch (error) {
    console.error('Error fetching latest news:', error);
    throw error;
  }
};

/**
 * Fetch news articles by category
 * @param {string} category Category name
 * @returns {Promise<Array>} Array of news articles in the category
 */
export const fetchNewsByCategory = async (category) => {
  try {
    const response = await axios.get(`/api/news/category/${category}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${category} news:`, error);
    throw error;
  }
};

/**
 * Fetch a single news article by ID
 * @param {string|number} id Article ID
 * @returns {Promise<Object>} News article
 */
export const fetchNewsById = async (id) => {
  try {
    const response = await axios.get(`/api/news/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching news article ${id}:`, error);
    throw error;
  }
};
