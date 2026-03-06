const User = require('../models/User');
const Group = require('../models/Group');
const fetchLeetCodeStats = require("../services/leetcodeService");
const calculateScore = require("../utils/scoreCalculator");

exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const now = new Date();
        const lastUpdated = user.lastUpdated || 0;
        
        const diff = (now - lastUpdated) / (1000 * 60); // Difference in minutes
        
        // Only refresh if more than 30 minutes have passed
        if (diff > 30) {
            try {
                const stats = await fetchLeetCodeStats(user.leetcodeUsername);
                const score = calculateScore(stats.easy, stats.medium, stats.hard);

                user.stats = {
                    easy: stats.easy,
                    medium: stats.medium,
                    hard: stats.hard,
                    total: stats.total,
                    score
                };
                user.lastUpdated = now;
                await user.save();
            } catch (error) {
                console.error("[PROFILE] Failed to refresh LeetCode stats:", error.message);
                // Continue with cached stats
            }
        }

        res.json({
            _id: user._id,
            name: user.name,
            leetcodeUsername: user.leetcodeUsername,
            stats: user.stats,
            lastUpdated: user.lastUpdated
        });
    } catch (error) {
        console.error("[PROFILE] Error:", error.message);
        res.status(500).json({ message: "Failed to fetch profile" });
    }
};

exports.getUserGroups = async (req, res) => {
    try {
        const groups = await Group.find({ members: req.user._id }).select("_id name createdBy").lean();
        res.json(groups);
    } catch (error) {
        console.error("[GET GROUPS] Error:", error.message);
        res.status(500).json({ message: "Failed to fetch groups" });
    }
};