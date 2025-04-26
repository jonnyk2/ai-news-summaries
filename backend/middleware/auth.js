const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// JWT secret key from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  // Get token from cookies or Authorization header
  const token = req.cookies?.token || req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification error:', error.message);
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// Optional authentication middleware - doesn't block if no token
const optionalAuth = (req, res, next) => {
  // Get token from cookies or Authorization header
  const token = req.cookies?.token || req.header('Authorization')?.replace('Bearer ', '');
  
  if (token) {
    try {
      // Verify the token
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    } catch (error) {
      // Just log the error but don't block the request
      console.error('Optional token verification error:', error.message);
    }
  }
  
  next();
};

module.exports = {
  authenticateToken,
  optionalAuth,
  JWT_SECRET
};
