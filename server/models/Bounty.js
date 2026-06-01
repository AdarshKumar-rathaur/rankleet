const mongoose = require("mongoose");

const bountySchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    goal: {
      type: String,
      required: true,
      // e.g., "Solve 10 Medium LeetCode problems"
    },
    description: {
      type: String,
      default: "",
    },
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      default: "Medium",
    },
    points: {
      type: Number,
      required: true,
      min: 1,
      // Virtual points staked on this bounty
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    acceptedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    completed: {
      type: Boolean,
      default: false,
      // Mark when the goal is achieved
    },
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      // Which user completed this bounty
    },
    completedAt: {
      type: Date,
    },
    claimedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        // Users who claimed the reward
      },
    ],
    claimed: {
      type: Boolean,
      default: false,
    },
    claimedAt: {
      type: Date,
    },
    deadline: {
      type: Date,
      // Optional deadline for the bounty
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Bounty", bountySchema);
