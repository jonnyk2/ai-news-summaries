const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cron = require('node-cron');
const cookieParser = require('cookie-parser');

// Load environment variables
dotenv.config();

// Import route handlers
const newsRoutes = require('./routes/news');
const aiRoutes = require('./routes/ai');
const trendingRoutes = require('./routes/trending');
const userRoutes = require('./routes/users');

// Initialize Express app
const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/news', newsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/trending', trendingRoutes);
app.use('/api/users', userRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date(), message: 'Backend server is running properly' });
});

// Add a more detailed API test endpoint
app.get('/api/test', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date(),
    message: 'API is functioning correctly',
    environment: process.env.NODE_ENV,
    apis: {
      news: '/api/news',
      newsByCategory: '/api/news/category/:category',
      newsById: '/api/news/:id',
      aiAnalyze: '/api/ai/analyze'
    }
  });
});

// Schedule news scraping job (every hour)
cron.schedule('0 * * * *', async () => {
  console.log('Running scheduled news scraping task');
  try {
    const { scrapeLatestNews } = require('./services/newsScraper');
    await scrapeLatestNews();
    console.log('News scraping completed successfully');
  } catch (error) {
    console.error('Error in scheduled news scraping:', error);
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});
