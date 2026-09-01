const express = require('express');
const router = express.Router();
const { getMessages, sendMessage } = require('../controllers/messageController');
const verifyToken = require('../middleware/verifyToken');

router.get('/:receiverId', verifyToken, getMessages);
router.post('/:receiverId', verifyToken, sendMessage);

module.exports = router;