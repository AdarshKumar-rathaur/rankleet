const express = require('express');
const router = express.Router();

const protect = require('../middleware/authMiddleware');
const {
    createGroup,
    joinGroupByLink,
    getGroupByInviteCode,
    getLeaderboard,
    deleteGroup
} = require('../controllers/groupController');

// Create a new group
router.post('/create', protect, createGroup);
router.post("/join/:inviteCode", protect, joinGroupByLink);
router.get('/:inviteCode', protect, getGroupByInviteCode); // Simplified
router.get('/:inviteCode/leaderboard', protect, getLeaderboard); // Standard REST
router.delete('/:inviteCode', protect, deleteGroup);

module.exports = router;