const express = require('express');
const router = express.Router();
const { getMessages, sendMessage, markMessagesAsRead } = require('../controllers/messageController');
const verifyToken = require('../middleware/verifyToken');

router.get('/:receiverId', verifyToken, getMessages);
router.post('/:receiverId', verifyToken, sendMessage);
router.put('/read/:senderId', verifyToken, markMessagesAsRead);

module.exports = router;