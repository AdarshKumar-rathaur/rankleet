const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const {
  getActivityFeed,
  getActivityByGroup,
  generateWeeklyActivity,
  likeActivity,
} = require("../controllers/aiActivityController");

/**
 * AI Activity Routes
 * Prefix: /ai-activity
 */

// Get global activity feed
router.get("/feed", protect, getActivityFeed);

// Get activities for a specific group
router.get("/group/:groupId", protect, getActivityByGroup);

// Generate weekly roast & hype (usually called by cron job)
// Can also be called manually for testing
router.post("/generate-weekly/:groupId", protect, generateWeeklyActivity);

// Like an activity
router.post("/:activityId/like", protect, likeActivity);

module.exports = router;
