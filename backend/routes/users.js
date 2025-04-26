const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../utils/database');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');
const router = express.Router();

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Check if user already exists
    db.get('SELECT * FROM users WHERE email = ? OR username = ?', [email, username], async (err, user) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Server error' });
      }
      
      if (user) {
        return res.status(400).json({ message: 'User already exists' });
      }
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      // Insert new user
      db.run(
        'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
        [username, email, hashedPassword],
        function(err) {
          if (err) {
            console.error('Error creating user:', err);
            return res.status(500).json({ message: 'Error creating user' });
          }
          
          const userId = this.lastID;
          
          // Create default user preferences
          db.run(
            'INSERT INTO user_preferences (user_id, preferred_categories, preferred_sources, preferred_ai_models) VALUES (?, ?, ?, ?)',
            [
              userId, 
              JSON.stringify(['technology', 'business', 'politics']), 
              JSON.stringify([]), 
              JSON.stringify(['chatgpt', 'claude', 'gemini', 'copilot'])
            ],
            (err) => {
              if (err) {
                console.error('Error creating user preferences:', err);
              }
            }
          );
          
          // Create and sign JWT token
          const token = jwt.sign(
            { id: userId, username, email },
            JWT_SECRET,
            { expiresIn: '7d' }
          );
          
          // Set cookie with token
          res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
          });
          
          res.status(201).json({
            message: 'User registered successfully',
            user: {
              id: userId,
              username,
              email
            },
            token
          });
        }
      );
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Find user by email
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Server error' });
      }
      
      if (!user) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
      
      // Compare passwords
      const isMatch = await bcrypt.compare(password, user.password);
      
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
      
      // Create and sign JWT token
      const token = jwt.sign(
        { id: user.id, username: user.username, email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      // Set cookie with token
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      
      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        },
        token
      });
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Logout user
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

// Get current user profile
router.get('/profile', authenticateToken, (req, res) => {
  db.get('SELECT id, username, email, created_at FROM users WHERE id = ?', [req.user.id], (err, user) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Server error' });
    }
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ user });
  });
});

// Get user preferences
router.get('/preferences', authenticateToken, (req, res) => {
  db.get('SELECT * FROM user_preferences WHERE user_id = ?', [req.user.id], (err, preferences) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Server error' });
    }
    
    if (!preferences) {
      return res.status(404).json({ message: 'Preferences not found' });
    }
    
    // Parse JSON strings to arrays
    const result = {
      ...preferences,
      preferred_categories: JSON.parse(preferences.preferred_categories || '[]'),
      preferred_sources: JSON.parse(preferences.preferred_sources || '[]'),
      preferred_ai_models: JSON.parse(preferences.preferred_ai_models || '[]')
    };
    
    res.json({ preferences: result });
  });
});

// Update user preferences
router.put('/preferences', authenticateToken, (req, res) => {
  const { preferred_categories, preferred_sources, preferred_ai_models, theme } = req.body;
  
  // Convert arrays to JSON strings for storage
  const categoriesToStore = preferred_categories ? JSON.stringify(preferred_categories) : null;
  const sourcesToStore = preferred_sources ? JSON.stringify(preferred_sources) : null;
  const aiModelsToStore = preferred_ai_models ? JSON.stringify(preferred_ai_models) : null;
  
  db.run(
    `UPDATE user_preferences SET 
     preferred_categories = COALESCE(?, preferred_categories),
     preferred_sources = COALESCE(?, preferred_sources),
     preferred_ai_models = COALESCE(?, preferred_ai_models),
     theme = COALESCE(?, theme),
     updated_at = CURRENT_TIMESTAMP
     WHERE user_id = ?`,
    [categoriesToStore, sourcesToStore, aiModelsToStore, theme, req.user.id],
    function(err) {
      if (err) {
        console.error('Error updating preferences:', err);
        return res.status(500).json({ message: 'Server error' });
      }
      
      if (this.changes === 0) {
        // If no record was updated, create a new preferences record
        db.run(
          `INSERT INTO user_preferences 
           (user_id, preferred_categories, preferred_sources, preferred_ai_models, theme) 
           VALUES (?, ?, ?, ?, ?)`,
          [req.user.id, categoriesToStore, sourcesToStore, aiModelsToStore, theme],
          (err) => {
            if (err) {
              console.error('Error creating preferences:', err);
              return res.status(500).json({ message: 'Server error' });
            }
            
            res.json({ message: 'Preferences created successfully' });
          }
        );
      } else {
        res.json({ message: 'Preferences updated successfully' });
      }
    }
  );
});

// Save an article
router.post('/saved-articles', authenticateToken, (req, res) => {
  const { article_id } = req.body;
  
  if (!article_id) {
    return res.status(400).json({ message: 'Article ID is required' });
  }
  
  db.run(
    'INSERT OR IGNORE INTO saved_articles (user_id, article_id) VALUES (?, ?)',
    [req.user.id, article_id],
    function(err) {
      if (err) {
        console.error('Error saving article:', err);
        return res.status(500).json({ message: 'Server error' });
      }
      
      res.json({ message: 'Article saved successfully' });
    }
  );
});

// Get saved articles
router.get('/saved-articles', authenticateToken, (req, res) => {
  db.all('SELECT article_id, saved_at FROM saved_articles WHERE user_id = ? ORDER BY saved_at DESC', [req.user.id], (err, articles) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Server error' });
    }
    
    res.json({ saved_articles: articles });
  });
});

// Remove saved article
router.delete('/saved-articles/:articleId', authenticateToken, (req, res) => {
  db.run(
    'DELETE FROM saved_articles WHERE user_id = ? AND article_id = ?',
    [req.user.id, req.params.articleId],
    function(err) {
      if (err) {
        console.error('Error removing saved article:', err);
        return res.status(500).json({ message: 'Server error' });
      }
      
      res.json({ message: 'Article removed successfully' });
    }
  );
});

// Record reading history
router.post('/reading-history', authenticateToken, (req, res) => {
  const { article_id } = req.body;
  
  if (!article_id) {
    return res.status(400).json({ message: 'Article ID is required' });
  }
  
  db.run(
    'INSERT INTO reading_history (user_id, article_id) VALUES (?, ?)',
    [req.user.id, article_id],
    function(err) {
      if (err) {
        console.error('Error recording reading history:', err);
        return res.status(500).json({ message: 'Server error' });
      }
      
      res.json({ message: 'Reading history recorded successfully' });
    }
  );
});

// Get reading history
router.get('/reading-history', authenticateToken, (req, res) => {
  db.all(
    'SELECT article_id, read_at FROM reading_history WHERE user_id = ? ORDER BY read_at DESC LIMIT 50',
    [req.user.id],
    (err, history) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Server error' });
      }
      
      res.json({ reading_history: history });
    }
  );
});

module.exports = router;
