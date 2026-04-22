const User = require('../models/User');
const Post = require('../models/Post');
const Message = require('../models/Message');
const jwt = require('jsonwebtoken');

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || !secret.trim()) {
    const error = new Error('Server configuration error: JWT_SECRET is missing');
    error.statusCode = 500;
    throw error;
  }
  return secret;
};

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, getJwtSecret(), {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Sign Up
exports.signup = async (req, res) => {
  try {
    const { username, email, password, passwordConfirm, name, photo } = req.body;

    // Validation
    if (!username || !email || !password || !passwordConfirm || !name) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields (username, email, password, name)'
      });
    }

    if (password !== passwordConfirm) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({
        success: false,
        message: 'Username must be between 3 and 20 characters'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Check if user already exists
    if (User.emailExists(email)) {
      return res.status(400).json({
        success: false,
        message: 'Email already in use'
      });
    }

    if (User.usernameExists(username)) {
      return res.status(400).json({
        success: false,
        message: 'Username already taken'
      });
    }

    // Create user
    const user = User.create({
      username,
      email,
      password,
      name,
      photo: photo || null
    });

    // Generate token
    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        photo: user.photo,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message:
        error.message === 'Server configuration error: JWT_SECRET is missing'
          ? 'Server is not configured correctly. Please contact admin.'
          : error.message || 'Sign up failed'
    });
  }
};

// Sign In
exports.signin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Check for user with password
    const user = User.findByEmailWithPassword(email);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordValid = User.matchPassword(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user.id);

    res.status(200).json({
      success: true,
      message: 'Signed in successfully',
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        photo: user.photo,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message:
        error.message === 'Server configuration error: JWT_SECRET is missing'
          ? 'Server is not configured correctly. Please contact admin.'
          : error.message || 'Sign in failed'
    });
  }
};

// Get Current User (Protected Route Example)
exports.getCurrentUser = async (req, res) => {
  try {
    const user = User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        photo: user.photo,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update Profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, username, email, photo } = req.body;
    const userId = req.user.userId;

    const currentUser = User.findByIdWithPassword(userId);

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!name || !username || !email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, username, and email'
      });
    }

    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({
        success: false,
        message: 'Username must be between 3 and 20 characters'
      });
    }

    if (User.emailExistsForOtherUser(email, userId)) {
      return res.status(400).json({
        success: false,
        message: 'Email already in use'
      });
    }

    if (User.usernameExistsForOtherUser(username, userId)) {
      return res.status(400).json({
        success: false,
        message: 'Username already taken'
      });
    }

    const updatedUser = User.updateById(userId, {
      name,
      username,
      email,
      photo: photo !== undefined ? photo : currentUser.photo
    });

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Profile update failed'
    });
  }
};

// Delete Account
exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = User.deleteById(userId);

    Post.deleteByAuthor(userId);
    Message.deleteByUser(userId);

    if (!result.ok) {
      return res.status(404).json({
        success: false,
        message: result.message || 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Account delete failed'
    });
  }
};
