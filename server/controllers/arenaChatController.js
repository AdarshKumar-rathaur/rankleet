const Message = require("../models/Message");
const mongoose = require("mongoose");

exports.getArenaMessages = async (req, res) => {
  try {
    const { arenaId } = req.params;
    const { cursor } = req.query;

    if (!mongoose.Types.ObjectId.isValid(arenaId)) {
      return res.status(400).json({ message: "Invalid arena id" });
    }

    const query = { arenaId: new mongoose.Types.ObjectId(arenaId) };
    if (cursor) {
      query._id = { $lt: new mongoose.Types.ObjectId(cursor) };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: 1, _id: 1 })
      .limit(50)
      .populate("senderId", "name avatar leetcodeUsername")
      .lean();

    const nextCursor = messages.length > 0 ? messages[0]?._id : null;
    const hasMore = messages.length === 50;

    res.status(200).json({
      messages: messages.slice(-50),
      nextCursor,
      hasMore,
    });
  } catch (error) {
    console.error("Failed to fetch arena messages:", error);
    res.status(500).json({ message: "Failed to fetch arena messages" });
  }
};

exports.sendArenaMessage = async (req, res) => {
  try {
    const { arenaId } = req.params;
    const { text } = req.body;

    if (!mongoose.Types.ObjectId.isValid(arenaId)) {
      return res.status(400).json({ message: "Invalid arena id" });
    }

    const trimmed = String(text || "").trim();
    if (!trimmed) {
      return res.status(400).json({ message: "Message cannot be empty" });
    }

    const message = await Message.create({
      arenaId: new mongoose.Types.ObjectId(arenaId),
      senderId: req.user._id,
      text: trimmed,
    });

    const populated = await message.populate("senderId", "name avatar leetcodeUsername");

    res.status(201).json({ message: populated });
  } catch (error) {
    console.error("Failed to send arena message:", error);
    res.status(500).json({ message: "Failed to send arena message" });
  }
};
