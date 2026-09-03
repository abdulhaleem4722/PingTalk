const express = require('express');
const router = express.Router();
const { getUsersForSidebar, updateProfilePic, searchUserByEmail } = require('../controllers/userController');
const verifyToken = require('../middleware/verifyToken');

router.get('/', verifyToken, getUsersForSidebar);
router.get('/search', verifyToken, searchUserByEmail);
router.put('/profile', verifyToken, updateProfilePic);

module.exports = router;