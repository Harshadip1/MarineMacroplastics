/**
 * Authentication Routes
 * Handles user login, registration, and token management
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'Auth routes working', timestamp: new Date() });
});

// Validation schemas
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('admin', 'worker', 'supervisor').default('worker'),
  phone: Joi.string().optional(),
  fcmToken: Joi.string().optional()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  fcmToken: Joi.string().optional()
});

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

/**
 * @route   POST /api/auth/register
 * @desc    Register new user (Admin only can create other admins)
 * @access  Public (with restrictions)
 */
router.post('/register', async (req, res, next) => {
  try {
    // Validate input
    const { error } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { name, email, password, role, phone, fcmToken } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role,
      phone,
      fcmToken
    });

    logger.info(`New user registered: ${email}, Role: ${role}`);

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', async (req, res, next) => {
  try {
    // Validate input
    const { error } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { email, password, fcmToken } = req.body;

    // OFFLINE MODE: Use default credentials without database
    const defaultCredentials = [
      { email: 'admin@marineplastic.com', password: 'admin123', role: 'admin', name: 'Admin User' },
      { email: 'supervisor@marineplastic.com', password: 'supervisor123', role: 'supervisor', name: 'Supervisor User' },
      { email: 'worker1@marineplastic.com', password: 'worker123', role: 'worker', name: 'Worker One' },
      { email: 'demo@marineplastic.com', password: 'demo123', role: 'admin', name: 'Demo User' }
    ];

    const matchedUser = defaultCredentials.find(cred => cred.email === email && cred.password === password);
    
    if (matchedUser) {
      const mockUser = {
        _id: 'user_' + Math.random().toString(36).substr(2, 9),
        name: matchedUser.name,
        email: matchedUser.email,
        role: matchedUser.role,
        phone: '+1234567890',
        stats: {
          totalCollections: Math.floor(Math.random() * 50),
          totalWeight: Math.floor(Math.random() * 1000),
          tasksCompleted: Math.floor(Math.random() * 30),
          tasksAssigned: Math.floor(Math.random() * 40)
        },
        isActive: true
      };

      logger.info(`Offline login: ${email}`);

      // Generate token
      const token = generateToken(mockUser._id);

      return res.status(200).json({
        success: true,
        token,
        user: {
          id: mockUser._id,
          name: mockUser.name,
          email: mockUser.email,
          role: mockUser.role,
          phone: mockUser.phone,
          stats: mockUser.stats
        }
      });
    }

    // If no match, return error
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials. Use demo@marineplastic.com / demo123'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current logged in user
 * @access  Private
 */
router.get('/me', protect, async (req, res, next) => {
  try {
    // OFFLINE MODE: Return mock user data
    const mockUser = {
      id: 'demo_user_id',
      name: 'Demo User',
      email: 'demo@marineplastic.com',
      role: 'admin',
      phone: '+1234567890',
      currentLocation: null,
      assignedZone: null,
      stats: {
        totalCollections: 25,
        totalWeight: 567.8,
        tasksCompleted: 18,
        tasksAssigned: 32
      },
      lastLogin: new Date()
    };
    
    res.status(200).json({
      success: true,
      user: mockUser
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/auth/location
 * @desc    Update worker current location
 * @access  Private (Workers only)
 */
router.put('/location', protect, async (req, res, next) => {
  try {
    const { longitude, latitude } = req.body;

    if (!longitude || !latitude) {
      return res.status(400).json({
        success: false,
        message: 'Please provide longitude and latitude'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        currentLocation: {
          type: 'Point',
          coordinates: [longitude, latitude]
        }
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Location updated',
      location: user.currentLocation
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/auth/fcm-token
 * @desc    Update FCM token for push notifications
 * @access  Private
 */
router.put('/fcm-token', protect, async (req, res, next) => {
  try {
    const { fcmToken } = req.body;

    if (!fcmToken) {
      return res.status(400).json({
        success: false,
        message: 'Please provide FCM token'
      });
    }

    await User.findByIdAndUpdate(req.user.id, { fcmToken });

    res.status(200).json({
      success: true,
      message: 'FCM token updated'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (invalidate token on client side)
 * @access  Private
 */
router.post('/logout', protect, async (req, res) => {
  // Client should remove token
  // Optionally: Add token to blacklist (using Redis in production)
  
  logger.info(`User logged out: ${req.user.email}`);
  
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

module.exports = router;
