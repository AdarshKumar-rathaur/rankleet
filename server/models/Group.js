const mongoose = require("mongoose");

const exitedMemberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    exitedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

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
    exitedMembers: {
      type: [exitedMemberSchema],
      default: [],
    },
  },
  { timestamps: true },
);

// NEW: Index to speed up finding which groups a user belongs to
groupSchema.index({ members: 1 });

const Group = mongoose.model("Group", groupSchema);

module.exports = Group;