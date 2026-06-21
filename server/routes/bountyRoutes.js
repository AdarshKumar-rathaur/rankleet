const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const {
  createBounty,
  getBountiesByGroup,
  joinBounty,
  resolveBounties,
} = require("../controllers/bountyController");

/**
 * Bounty Routes
 * Prefix: /bounties
 */

router.post("/create", protect, createBounty);
router.get("/group/:groupId", protect, getBountiesByGroup);
router.post("/:id/join", protect, joinBounty);
router.post("/resolve", resolveBounties);

module.exports = router;
