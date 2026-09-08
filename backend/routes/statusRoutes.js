const express = require('express');
const router = express.Router();
const { createStatus, getStatuses, viewStatus, getStatusViewers, deleteStatus } = require('../controllers/statusController');
const verifyToken = require('../middleware/verifyToken');

router.post('/', verifyToken, createStatus);
router.get('/', verifyToken, getStatuses);
router.put('/:statusId/view', verifyToken, viewStatus);
router.get('/:statusId/viewers', verifyToken, getStatusViewers);
router.delete('/:statusId', verifyToken, deleteStatus);

module.exports = router;