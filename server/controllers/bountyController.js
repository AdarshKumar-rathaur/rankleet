const Bounty = require("../models/Bounty");
const Group = require("../models/Group");
const User = require("../models/User");
const { successResponse, errorResponse } = require("../utils/responseFormatter");

/**
 * Create a new bounty for a group
 * POST /bounties/create
 * Body: { groupId, goal, description, difficulty, points, deadline? }
 */
exports.createBounty = async (req, res) => {
  try {
    const { groupId, goal, description, difficulty, points, deadline } = req.body;
    const userId = req.user._id;

    // Validate input
    if (!groupId || !goal || !points || points < 1) {
      return res.status(400).json(errorResponse("Invalid bounty data", 400));
    }

    // Check if user is part of the group
    const group = await Group.findById(groupId);
    if (!group || !group.members.includes(userId)) {
      return res.status(403).json(errorResponse("Not a member of this group", 403));
    }

    // Create bounty
    const bounty = new Bounty({
      group: groupId,
      goal,
      description: description || "",
      difficulty: difficulty || "Medium",
      points,
      createdBy: userId,
      deadline: deadline ? new Date(deadline) : null,
    });

    await bounty.save();
    await bounty.populate("createdBy", "name");

    res.status(201).json(successResponse(bounty, "Bounty created successfully", 201));
  } catch (err) {
    res.status(500).json(errorResponse(err.message, 500));
  }
};

/**
 * Get all bounties for a group
 * GET /bounties/group/:groupId
 */
exports.getBountiesByGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    // Check if user is part of the group
    const group = await Group.findById(groupId);
    if (!group || !group.members.includes(userId)) {
      return res.status(403).json(errorResponse("Not a member of this group", 403));
    }

    const bounties = await Bounty.find({ group: groupId })
      .populate("createdBy", "name")
      .populate("acceptedBy", "name")
      .populate("completedBy", "name")
      .populate("claimedBy", "name")
      .sort({ createdAt: -1 });

    res.status(200).json(successResponse(bounties, "Bounties retrieved successfully", 200));
  } catch (err) {
    res.status(500).json(errorResponse(err.message, 500));
  }
};

/**
 * Accept a bounty (user commits to completing it)
 * POST /bounties/:bountyId/accept
 */
exports.acceptBounty = async (req, res) => {
  try {
    const { bountyId } = req.params;
    const userId = req.user._id;

    const bounty = await Bounty.findById(bountyId);
    if (!bounty) {
      return res.status(404).json(errorResponse("Bounty not found", 404));
    }

    // Check if already accepted
    if (bounty.acceptedBy.includes(userId)) {
      return res.status(400).json(errorResponse("Already accepted this bounty", 400));
    }

    bounty.acceptedBy.push(userId);
    await bounty.save();

    res.status(200).json(successResponse(bounty, "Bounty accepted", 200));
  } catch (err) {
    res.status(500).json(errorResponse(err.message, 500));
  }
};

/**
 * Mark bounty as completed and claim reward
 * POST /bounties/:bountyId/claim
 */
exports.claimBounty = async (req, res) => {
  try {
    const { bountyId } = req.params;
    const userId = req.user._id;

    const bounty = await Bounty.findById(bountyId);
    if (!bounty) {
      return res.status(404).json(errorResponse("Bounty not found", 404));
    }

    // Check if user accepted it
    if (!bounty.acceptedBy.includes(userId)) {
      return res.status(403).json(errorResponse("Must accept bounty first", 403));
    }

    // Mark as completed
    if (!bounty.completed) {
      bounty.completed = true;
      bounty.completedBy = userId;
      bounty.completedAt = new Date();
    }

    // Add to claimed list
    if (!bounty.claimedBy.includes(userId)) {
      bounty.claimedBy.push(userId);
    }

    bounty.claimed = true;
    bounty.claimedAt = new Date();

    // Add points to user's bountyPoints (decoupled from stats.score)
    const user = await User.findById(userId);
    if (user) {
      user.bountyPoints = (user.bountyPoints || 0) + bounty.points;
      await user.save();
    }

    await bounty.save();

    res.status(200).json(successResponse(bounty, "Bounty claimed! Points added", 200));
  } catch (err) {
    res.status(500).json(errorResponse(err.message, 500));
  }
};

/**
 * Delete a bounty (only creator or group admin can delete)
 * DELETE /bounties/:bountyId
 */
exports.deleteBounty = async (req, res) => {
  try {
    const { bountyId } = req.params;
    const userId = req.user._id;

    const bounty = await Bounty.findById(bountyId);
    if (!bounty) {
      return res.status(404).json(errorResponse("Bounty not found", 404));
    }

    // Only creator can delete
    if (bounty.createdBy.toString() !== userId) {
      return res.status(403).json(errorResponse("Only creator can delete bounty", 403));
    }

    await Bounty.findByIdAndDelete(bountyId);

    res.status(200).json(successResponse(null, "Bounty deleted successfully", 200));
  } catch (err) {
    res.status(500).json(errorResponse(err.message, 500));
  }
};