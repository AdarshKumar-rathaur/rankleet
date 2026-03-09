const Group = require("../models/Group");
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

    group.members.push(req.user._id);
    await group.save();

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
      .populate("members", "name leetcodeUsername stats")
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
      "name leetcodeUsername stats",
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

    await Group.findByIdAndDelete(group._id);
    res.status(200).json({ message: "Group deleted successfully" });
  } catch (error) {
    console.error("Error deleting group:", error.message);
    res.status(500).json({ message: "Error deleting group" });
  }
};
