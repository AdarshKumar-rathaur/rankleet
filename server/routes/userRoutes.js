const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  getUserProfile,
  getUserGroups,
  getLeetCodeTotals,
  refreshUserData,
  syncUserPoints,
} = require("../controllers/userController");

router.get("/profile", protect, getUserProfile);
router.get("/groups", protect, getUserGroups);
router.get("/leetcode-totals", getLeetCodeTotals);
router.post("/refresh", protect, refreshUserData);
router.post("/sync-points", protect, syncUserPoints);

module.exports = router;