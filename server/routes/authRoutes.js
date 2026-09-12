const express = require('express');
const router = express.Router();
const {
  sendOtp,
  verifyOtp,
  register,
  login,
  loginWithOtp,
  resetPassword,
  getProfile,
  updateProfile,
  updateNotificationPrefs,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/register', register);
router.post('/login', login);
router.post('/login-otp', loginWithOtp);
router.post('/reset-password', resetPassword);

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/notification-prefs', protect, updateNotificationPrefs);

module.exports = router;
