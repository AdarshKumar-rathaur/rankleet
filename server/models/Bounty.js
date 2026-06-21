const mongoose = require("mongoose");

const bountyParticipantSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    wager: {
      type: Number,
      required: true,
      min: 1,
    },
    startingStats: {
      easy: {
        type: Number,
        default: 0,
      },
      medium: {
        type: Number,
        default: 0,
      },
      hard: {
        type: Number,
        default: 0,
      },
      total: {
        type: Number,
        default: 0,
      },
    },
    completed: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const bountySchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    objectiveType: {
      type: String,
      enum: ["EASY", "MEDIUM", "HARD", "TOTAL"],
      required: true,
    },
    targetAmount: {
      type: Number,
      required: true,
      min: 1,
    },
    deadline: {
      type: Date,
      required: true,
    },
    totalPool: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ["OPEN", "RESOLVED"],
      default: "OPEN",
    },
    participants: [bountyParticipantSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Bounty", bountySchema);
