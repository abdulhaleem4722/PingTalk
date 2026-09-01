const express = require('express');
const router = express.Router();
const { getUsersForSidebar } = require('../controllers/userController');
const verifyToken = require('../middleware/verifyToken');

router.get('/', verifyToken, getUsersForSidebar);

module.exports = router;