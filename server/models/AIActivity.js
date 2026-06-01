const mongoose = require("mongoose");

const aiActivitySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["roast", "hype", "insight"],
      default: "hype",
      // Type of AI-generated content
    },
    content: {
      type: String,
      required: true,
      // The AI-generated message (roast or hype)
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      // Which group this activity is for
    },
    generatedFrom: {
      // Reference data used to generate this content
      weeklyStats: {
        groupName: String,
        totalProblems: Number,
        totalPoints: Number,
        members: Number,
        topPerformer: String,
        topPerformerStats: {
          easy: Number,
          medium: Number,
          hard: Number,
        },
      },
    },
    aiModel: {
      type: String,
      default: "gpt-3.5-turbo",
      // Which LLM generated this
    },
    likeCount: {
      type: Number,
      default: 0,
    },
    likedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("AIActivity", aiActivitySchema);
