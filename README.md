# AI News Debate Platform

A platform that aggregates news articles from various sources and provides AI-generated analyses and debates about these articles from multiple AI perspectives.

## Features

- **News Aggregation**: Fetches news from multiple sources with fallback mechanisms
- **Category Filtering**: Filter news by categories like technology, business, health, etc.
- **AI Analysis**: Get perspectives from multiple AI models on news articles
- **Debate Mode**: Watch AI models debate and discuss news articles
- **Responsive UI**: Modern, responsive user interface

## Project Structure

- **Frontend**: React application with components for displaying news and AI analyses
- **Backend**: Express.js server that fetches news and generates AI analyses

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies for both frontend and backend:

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

3. Configure environment variables:
   - Copy `backend/.env.example` to `backend/.env`
   - Add your API keys for news sources (see below)

4. Start the application:

```bash
# Using the start script
.\start-app.bat

# Or manually:
# Terminal 1 - Start backend
cd backend
npm run dev

# Terminal 2 - Start frontend
npm start
```

5. Open your browser and navigate to `http://localhost:3000`

## News API Configuration

The application can fetch news from multiple sources with automatic fallback. You only need to provide keys for the services you want to use:

1. **NewsAPI.org** (https://newsapi.org/):
   - Sign up for a free account
   - Get your API key and add it to `NEWS_API_KEY` in `.env`

2. **GNews API** (https://gnews.io/):
   - Sign up for a free account
   - Get your API key and add it to `GNEWS_API_KEY` in `.env`

3. **MediaStack API** (https://mediastack.com/):
   - Sign up for a free account
   - Get your API key and add it to `MEDIASTACK_API_KEY` in `.env`

If no API keys are provided, the application will fall back to web scraping for basic news data, or use mock data as a last resort.

## Testing News Sources

You can test the news fetching functionality with the following endpoint:

```
GET /api/news/test-sources?category=technology&forceUpdate=true
```

This will attempt to fetch news from all configured sources and return information about which sources were successful.

## Refreshing News Data

To manually refresh the news cache:

```
POST /api/news/refresh
```

This will update all news categories with fresh data.

## AI Models

The platform currently simulates AI analyses, but can be extended to use real AI models by configuring the appropriate API keys in the `.env` file.

## License

MIT
