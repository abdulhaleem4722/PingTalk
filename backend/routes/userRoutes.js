const express = require('express');
const router = express.Router();
const { getUsersForSidebar, updateProfilePic } = require('../controllers/userController');
const verifyToken = require('../middleware/verifyToken');

router.get('/', verifyToken, getUsersForSidebar);
router.put('/profile', verifyToken, updateProfilePic);

module.exports = router;