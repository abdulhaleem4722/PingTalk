const express = require('express');
const router = express.Router();
const { signup, verifyOTP, resendOTP, login } = require('../controllers/authController');

router.post('/signup', signup);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/login', login);

module.exports = router;