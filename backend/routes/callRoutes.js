const express = require('express');
const router = express.Router();
const { logCall, getCallHistory } = require('../controllers/callController');
const verifyToken = require('../middleware/verifyToken');

router.post('/', verifyToken, logCall);
router.get('/:otherUserId', verifyToken, getCallHistory);

module.exports = router;