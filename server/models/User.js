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
      },
    },
    lastUpdated: {
      type: Date,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
