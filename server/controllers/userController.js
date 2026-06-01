const User = require('../models/User');
const Group = require('../models/Group');
const fetchLeetCodeStats = require("../services/leetcodeService");
const calculateScore = require("../utils/scoreCalculator");

exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).lean();
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const stats = user.stats || {
            easy: 0,
            medium: 0,
            hard: 0,
            total: 0,
            score: 0,
        };

        res.json({
            _id: user._id,
            name: user.name,
            leetcodeUsername: user.leetcodeUsername,
            stats,
            lastUpdated: user.lastUpdated,
        });

        const lastUpdatedTime = new Date(user.lastUpdated || 0).getTime();
        const diffMinutes = (Date.now() - lastUpdatedTime) / (1000 * 60);

        if (user.leetcodeUsername && diffMinutes > 30) {
            setImmediate(async () => {
                try {
                    const stats = await fetchLeetCodeStats(user.leetcodeUsername);
                    const score = calculateScore(stats.easy, stats.medium, stats.hard);

                    await User.updateOne(
                        { _id: req.user._id },
                        {
                            $set: {
                                stats: {
                                    easy: stats.easy,
                                    medium: stats.medium,
                                    hard: stats.hard,
                                    total: stats.total,
                                    score,
                                },
                                lastUpdated: new Date(),
                            },
                        }
                    );
                    console.log("[PROFILE] Background refresh complete for", user._id);
                } catch (error) {
                    console.error("[PROFILE] Background refresh failed:", error.message);
                }
            });
        }
    } catch (error) {
        console.error("[PROFILE] Error:", error.message);
        res.status(500).json({ message: "Failed to fetch profile" });
    }
};

exports.getUserGroups = async (req, res) => {
    try {
        // We include 'members' so the frontend can do group.members.length
        const groups = await Group.find({ members: req.user._id })
            .select("inviteCode name createdBy members") 
            .lean();

        res.json(groups);
    } catch (error) {
        console.error("[GET GROUPS] Error:", error.message);
        res.status(500).json({ message: "Failed to fetch groups" });
    }
};