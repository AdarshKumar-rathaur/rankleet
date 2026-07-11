const express = require("express");
const protect = require("../middleware/authMiddleware");
const { getArenaMessages, sendArenaMessage } = require("../controllers/arenaChatController");

const router = express.Router();

router.get("/:arenaId/messages", protect, getArenaMessages);
router.post("/:arenaId/messages", protect, sendArenaMessage);

module.exports = router;
