const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    inviteCode: {
      type: String,
      required: true,
      unique: true,
      index: true, // Index for frequent group lookups by invite code
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true },
);

// NEW: Index to speed up finding which groups a user belongs to
groupSchema.index({ members: 1 });

const Group = mongoose.model("Group", groupSchema);

module.exports = Group;