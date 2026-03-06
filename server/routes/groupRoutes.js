const express = require('express');
const router = express.Router();

const protect = require('../middleware/authMiddleware');
const {
    createGroup,
    joinGroupByLink,
    getGroupById,
    getLeaderboard,
    deleteGroup
} = require('../controllers/groupController');

// Create a new group
router.post('/create', protect, createGroup);
router.post("/join/:inviteCode", protect, joinGroupByLink);
router.get('/:groupId', protect, getGroupById);
router.get('/:groupId/leaderboard', protect, getLeaderboard);
router.delete('/:groupId', protect, deleteGroup);

module.exports = router;