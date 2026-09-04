const express = require('express');
const router = express.Router();
const {
  createStatus,
  getStatuses,
  viewStatus,
  deleteStatus,
  getViewers,
  replyToStatus,
  getMyStatusReplies,
} = require('../controllers/statusController');
const verifyToken = require('../middleware/verifyToken');

router.post('/', verifyToken, createStatus);
router.get('/', verifyToken, getStatuses);
router.put('/:statusId/view', verifyToken, viewStatus);
router.delete('/:statusId', verifyToken, deleteStatus);

// Naye routes - viewers list, reply, aur my replies
router.get('/:statusId/viewers', verifyToken, getViewers);
router.post('/:statusId/reply', verifyToken, replyToStatus);
router.get('/replies/my', verifyToken, getMyStatusReplies);

module.exports = router;