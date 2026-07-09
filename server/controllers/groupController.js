const Group = require("../models/Group");
const Bounty = require("../models/Bounty");
const mongoose = require("mongoose");
const { nanoid } = require("nanoid");

// Create a new group
exports.createGroup = async (req, res) => {
  try {
    const { name } = req.body;
    let code;
    let exists;
    do {
      code = nanoid(6);
      exists = await Group.findOne({ inviteCode: code });
    } while (exists);
    const group = await Group.create({
      name,
      inviteCode: code,
      createdBy: req.user._id,
      members: [req.user._id],
    });
    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ message: "Error creating group", error });
  }
};

// Join a group using invite code
exports.joinGroupByLink = async (req, res) => {
  try {
    const { inviteCode } = req.params;

    if (!inviteCode || inviteCode.trim().length === 0) {
      return res.status(400).json({ message: "Invalid invite code" });
    }

    const group = await Group.findOne({ inviteCode: inviteCode.trim() });
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check if already a member
    if (group.members.some((id) => id.toString() === req.user._id.toString())) {
      return res.status(200).json({
        message: "Already a member",
        inviteCode: inviteCode,
      });
    }

    // Use atomic $addToSet to prevent race conditions and duplicate adds
    const updatedGroup = await Group.findByIdAndUpdate(
      group._id,
      { $addToSet: { members: req.user._id } },
      { new: true }
    );

    res.json({
      message: "Joined group successfully",
      inviteCode: inviteCode,
    });
  } catch (error) {
    console.error("Error joining group:", error.message);
    res.status(500).json({ message: "Error joining group" });
  }
};

// Get a single group by invite code
exports.getGroupByInviteCode = async (req, res) => {
  try {
    const { inviteCode } = req.params;

    // Validate invite code
    if (!inviteCode || inviteCode.trim().length === 0) {
      return res.status(400).json({ message: "Invalid invite code" });
    }

    const group = await Group.findOne({ inviteCode: inviteCode.trim() })
      .populate("members", "name avatar leetcodeUsername stats contestRating bountyPoints")
      .populate("createdBy", "_id");
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check authorization - user must be a member
    if (
      !group.members.some((m) => m._id.toString() === req.user._id.toString())
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this group" });
    }
    res.status(200).json(group);
  } catch (error) {
    console.error("Error fetching group:", error.message);
    res.status(500).json({ message: "Error fetching group" });
  }
};

// Get group leaderboard
exports.getLeaderboard = async (req, res) => {
  try {
    const { inviteCode } = req.params;

    // Validate invite code
    if (!inviteCode || inviteCode.trim().length === 0) {
      return res.status(400).json({ message: "Invalid invite code" });
    }

    const group = await Group.findOne({ inviteCode: inviteCode.trim() }).populate(
      "members",
      "name avatar leetcodeUsername stats contestRating bountyPoints",
    );
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check authorization - user must be a member
    if (
      !group.members.some((m) => m._id.toString() === req.user._id.toString())
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Create sorted leaderboard
    const leaderboard = [...group.members].sort(
      (a, b) => (b.stats?.score || 0) - (a.stats?.score || 0),
    );

    res.status(200).json(leaderboard);
  } catch (error) {
    console.error("Error fetching leaderboard:", error.message);
    res.status(500).json({ message: "Error fetching leaderboard" });
  }
};

// Delete group (only by creator)
exports.deleteGroup = async (req, res) => {
  try {
    const { inviteCode } = req.params;

    // Validate invite code
    if (!inviteCode || inviteCode.trim().length === 0) {
      return res.status(400).json({ message: "Invalid invite code" });
    }

    const group = await Group.findOne({ inviteCode: inviteCode.trim() });
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check authorization - only creator can delete
    if (group.createdBy.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Only group creator can delete the group" });
    }
    const {deleteActivityOfGroup} = require("./aiActivityController");
    let r = await deleteActivityOfGroup(group._id); // Delete associated activities
    await Group.findByIdAndDelete(group._id);
    res.status(200).json({ message: "Group deleted successfully" });
  } catch (error) {
    console.error("Error deleting group:", error.message);
    res.status(500).json({ message: "Error deleting group" });
  }
};

exports.transferGroupOwnership = async (req, res) => {
  try {
    const { inviteCode } = req.params;
    const { newOwnerId } = req.body;

    if (!inviteCode || inviteCode.trim().length === 0) {
      return res.status(400).json({ message: "Invalid invite code" });
    }

    if (!newOwnerId) {
      return res.status(400).json({ message: "New owner is required" });
    }

    const group = await Group.findOne({ inviteCode: inviteCode.trim() });
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (group.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the group creator can transfer ownership" });
    }

    const isMember = group.members.some((memberId) => memberId.toString() === newOwnerId.toString());
    if (!isMember) {
      return res.status(400).json({ message: "Selected user must already be a member" });
    }

    if (group.createdBy.toString() === newOwnerId.toString()) {
      return res.status(400).json({ message: "Choose a different member as the new owner" });
    }

    group.createdBy = new mongoose.Types.ObjectId(newOwnerId);
    await group.save();

    const updatedGroup = await Group.findById(group._id)
      .populate("members", "name avatar leetcodeUsername stats contestRating bountyPoints")
      .populate("createdBy", "_id name avatar");

    res.status(200).json({
      message: "Ownership transferred successfully",
      data: updatedGroup,
    });
  } catch (error) {
    console.error("Error transferring group ownership:", error.message);
    res.status(500).json({ message: "Error transferring ownership" });
  }
};

exports.leaveGroup = async (req, res) => {
  try {
    const { inviteCode } = req.params;
    const userId = req.user._id;
    const now = new Date();

    if (!inviteCode || inviteCode.trim().length === 0) {
      return res.status(400).json({ message: "Invalid invite code" });
    }

    const group = await Group.findOne({ inviteCode: inviteCode.trim() });
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (group.createdBy.toString() === userId.toString()) {
      return res.status(403).json({
        message: "Group creators must transfer ownership before leaving",
        transferRequired: true,
      });
    }

    const isMember = group.members.some((memberId) => memberId.toString() === userId.toString());
    if (!isMember) {
      return res.status(404).json({ message: "You are not a member of this group" });
    }

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await Group.updateOne(
          { _id: group._id },
          {
            $pull: { members: userId },
            $push: {
              exitedMembers: {
                user: userId,
                exitedAt: now,
              },
            },
          },
          { session }
        );

        await Bounty.updateMany(
          { group: group._id, status: "OPEN", "participants.user": userId },
          {
            $set: {
              "participants.$[participant].exited": true,
              "participants.$[participant].exitedAt": now,
            },
          },
          {
            session,
            arrayFilters: [{ "participant.user": userId }],
          }
        );
      });

      const refreshedGroup = await Group.findById(group._id)
        .populate("members", "name avatar leetcodeUsername stats contestRating bountyPoints")
        .populate("createdBy", "_id name avatar");

      res.status(200).json({
        message: "Left arena successfully",
        data: refreshedGroup,
      });
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error("Error leaving group:", error.message);
    res.status(500).json({ message: "Error leaving group" });
  }
};
