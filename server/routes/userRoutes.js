const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { getUserProfile, getUserGroups } = require("../controllers/userController");

router.get("/profile", protect, getUserProfile);
router.get("/groups", protect, getUserGroups);

module.exports = router;