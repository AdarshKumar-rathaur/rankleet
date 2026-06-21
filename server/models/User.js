const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    leetcodeUsername: {
      type: String,
      required: true,
      index: true, // Index for frequently queried cron jobs
    },
    stats: {
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
      score: {
        type: Number,
        default: 0,
        index: true, // Index for leaderboard sorting
      },
    },
    contestRating: {
      type: Number,
      default: 0,
    },
    // Historical contest rating tracking
    contestHistory: [
      {
        rating: Number,
        date: Date,
        rank: Number,
        percentile: Number,
        title: String,
      },
    ],
    bountyPoints: {
      type: Number,
      default: 0,
    },
    lastRewardedStats: {
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
      contestRating: {
        type: Number,
        default: 0,
      },
      contestHistoryCount: {
        type: Number,
        default: 0,
      },
    },
    masteryPath: {
      type: Object,
      default: null,
    },
    // Daily submission calendar for heatmap (YYYY-MM-DD: count)
    submissionCalendar: {
      type: Map,
      of: Number,
      default: new Map(),
    },
    lastUpdated: {
      type: Date,
    },
  },
  { timestamps: true },
);

// Compound index for leaderboard sorting by score (descending)
userSchema.index({ "stats.score": -1 });

module.exports = mongoose.model("User", userSchema);
