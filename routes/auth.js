const express = require('express');
const { signup, signin, getCurrentUser, updateProfile, deleteAccount } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/signup', signup);
router.post('/signin', signin);

// Protected routes
router.get('/me', protect, getCurrentUser);
router.put('/profile', protect, updateProfile);
router.delete('/me', protect, deleteAccount);

module.exports = router;
