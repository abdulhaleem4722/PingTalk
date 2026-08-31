const express = require('express');
const router = express.Router();
const { signup, verifyOTP, resendOTP, login, getMe, logout } = require('../controllers/authController');
const verifyToken = require('../middleware/verifyToken');

router.post('/signup', signup);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/login', login);
router.get('/me', verifyToken, getMe);
router.post('/logout', logout);

module.exports = router;