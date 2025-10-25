const jwt = require('jsonwebtoken');
const pool = require('../config/database');

// Generate JWT tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'fallback-secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );

  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret',
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );

  return { accessToken, refreshToken };
};

// Store refresh token in database
const storeRefreshToken = async (userId, refreshToken) => {
  try {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    await pool.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [userId, refreshToken, expiresAt]
    );
  } catch (error) {
    console.error('Error storing refresh token:', error);
    throw error;
  }
};

// Verify and get user from JWT token
const verifyToken = (token, secret) => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
};

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access token required' 
      });
    }

    const decoded = verifyToken(token, process.env.JWT_SECRET || 'fallback-secret');
    
    if (!decoded) {
      return res.status(403).json({ 
        success: false, 
        message: 'Invalid or expired token' 
      });
    }

    // Get user from database
    const userResult = await pool.query(
      'SELECT id, username, email, full_name, bio, profile_picture_url, is_verified, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(403).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    const user = userResult.rows[0];
    
    if (!user.is_active) {
      return res.status(403).json({ 
        success: false, 
        message: 'Account is deactivated' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = verifyToken(token, process.env.JWT_SECRET || 'fallback-secret');
      
      if (decoded) {
        const userResult = await pool.query(
          'SELECT id, username, email, full_name, bio, profile_picture_url, is_verified, is_active FROM users WHERE id = $1',
          [decoded.userId]
        );

        if (userResult.rows.length > 0 && userResult.rows[0].is_active) {
          req.user = userResult.rows[0];
        }
      }
    }

    next();
  } catch (error) {
    console.error('Optional auth error:', error);
    next(); // Continue even if auth fails
  }
};

// Clean expired refresh tokens
const cleanExpiredTokens = async () => {
  try {
    await pool.query('DELETE FROM refresh_tokens WHERE expires_at < NOW()');
  } catch (error) {
    console.error('Error cleaning expired tokens:', error);
  }
};

// Run cleanup every hour
setInterval(cleanExpiredTokens, 60 * 60 * 1000);

module.exports = {
  generateTokens,
  storeRefreshToken,
  verifyToken,
  authenticateToken,
  optionalAuth,
  cleanExpiredTokens
};
