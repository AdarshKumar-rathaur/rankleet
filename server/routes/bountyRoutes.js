const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const {
  createBounty,
  getBountiesByGroup,
  acceptBounty,
  claimBounty,
  deleteBounty,
} = require("../controllers/bountyController");

/**
 * Bounty Routes
 * Prefix: /bounties
 */

// Create a new bounty
router.post("/create", protect, createBounty);

// Get all bounties for a group
router.get("/group/:groupId", protect, getBountiesByGroup);

// Accept a bounty
router.post("/:bountyId/accept", protect, acceptBounty);

// Claim/Complete a bounty
router.post("/:bountyId/claim", protect, claimBounty);

// Delete a bounty
router.delete("/:bountyId", protect, deleteBounty);

module.exports = router;
