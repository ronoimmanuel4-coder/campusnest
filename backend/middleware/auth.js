const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - require authentication
exports.protect = async (req, res, next) => {
  try {
    let token;
    
    // Check for token in header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    // Check for token in cookies
    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
    
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User no longer exists'
        });
      }
      
      // Check if account is locked
      if (req.user.isLocked) {
        return res.status(423).json({
          success: false,
          message: 'Account is locked due to multiple failed login attempts'
        });
      }
      
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token has expired. Please login again'
        });
      }
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token'
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

// Check if user has specific role
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    
    next();
  };
};

// Optional authentication - doesn't fail if no token
exports.optionalAuth = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password');
      } catch (error) {
        // Invalid token, but continue without user
        req.user = null;
      }
    }
    
    next();
  } catch (error) {
    console.error('Optional auth error:', error);
    next();
  }
};

// Check if user owns the resource
exports.checkOwnership = (model) => {
  return async (req, res, next) => {
    try {
      const Model = require(`../models/${model}`);
      const resource = await Model.findById(req.params.id);
      
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: `${model} not found`
        });
      }
      
      // Check ownership
      const ownerId = resource.user || resource.landlord || resource.owner;
      
      if (req.user.role !== 'admin' && ownerId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to modify this resource'
        });
      }
      
      req.resource = resource;
      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      res.status(500).json({
        success: false,
        message: 'Error checking resource ownership'
      });
    }
  };
};

// Verify email token
exports.verifyEmailToken = async (req, res, next) => {
  try {
    const { token } = req.params;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }
    
    const user = await User.findOne({ 
      verificationToken: token,
      isVerified: false
    });
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying email token'
    });
  }
};
