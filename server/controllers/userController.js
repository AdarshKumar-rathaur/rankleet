const User = require('../models/User');
const Group = require('../models/Group');
const { fetchAllUserData } = require("../services/leetcodeService");
const calculateScore = require("../utils/scoreCalculator");
const fetchLeetCodeTotals = require("../utils/leetcodeTotals");
const fetchRecentSubmissionTags = require("../services/leetcodeTagsService");
const generateMasteryPath = require("../services/masteryPathService");
const { successResponse, errorResponse } = require("../utils/responseFormatter");

/**
 * Safely convert a Mongoose Map (or plain object from .lean()) to a plain JS object.
 * .lean() serializes Maps as plain objects, so we handle both cases.
 */
function mapToObject(value) {
  if (!value) return {};
  if (value instanceof Map) return Object.fromEntries(value);
  if (typeof value === 'object') return value;
  return {};
}

exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).lean();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const stats = user.stats || { easy: 0, medium: 0, hard: 0, total: 0, score: 0 };
    const submissionCalendar = mapToObject(user.submissionCalendar);

    // Send response immediately with whatever is in DB
    res.json({
      _id: user._id,
      name: user.name,
      leetcodeUsername: user.leetcodeUsername,
      stats,
      contestRating: user.contestRating || 0,
      contestHistory: user.contestHistory || [],
      submissionCalendar,
      bountyPoints: user.bountyPoints || 0,
      masteryPath: user.masteryPath || null,
      lastUpdated: user.lastUpdated,
    });

    if (!user.leetcodeUsername) return;

    // Determine what needs refreshing
    const lastUpdatedTime = new Date(user.lastUpdated || 0).getTime();
    const diffMinutes = (Date.now() - lastUpdatedTime) / (1000 * 60);
    const needsMasteryPath = !user.masteryPath;
    const needsCalendar = Object.keys(mapToObject(user.submissionCalendar)).length === 0;
    const isStale = diffMinutes > 30;

    if (isStale || needsMasteryPath || needsCalendar) {
      setImmediate(async () => {
        try {
          // Single batched LeetCode request
          const { stats: freshStats, contestRating, contestRanking, contestPercentile, submissionCalendar: calendar, contestHistory } =
            await fetchAllUserData(user.leetcodeUsername);

          const score = calculateScore(freshStats.easy, freshStats.medium, freshStats.hard);

          const updateOp = {
            $set: {
              stats: {
                easy: freshStats.easy,
                medium: freshStats.medium,
                hard: freshStats.hard,
                total: freshStats.total,
                score,
              },
              submissionCalendar: calendar,
              lastUpdated: new Date(),
            },
          };

          // Replace full contest history if fetched successfully, otherwise fall back to incremental append
          if (contestHistory?.length > 0) {
            updateOp.$set.contestHistory = contestHistory;
            updateOp.$set.contestRating = contestHistory[contestHistory.length - 1].rating;
          } else if (contestRating > 0) {
            const lastEntry = user.contestHistory?.[user.contestHistory.length - 1];
            const ratingChanged = !lastEntry || lastEntry.rating !== contestRating;
            if (ratingChanged) {
              updateOp.$push = {
                contestHistory: {
                  rating: contestRating,
                  date: new Date(),
                  rank: contestRanking || 0,
                  percentile: contestPercentile || 0,
                }
              };
              updateOp.$set.contestRating = contestRating;
            }
          }

          // Generate mastery path if missing
          if (needsMasteryPath) {
            try {
              const tags = await fetchRecentSubmissionTags(user.leetcodeUsername);
              const masteryPath = await generateMasteryPath(freshStats, tags);
              updateOp.$set.masteryPath = masteryPath;
              console.log("[PROFILE] Mastery path generated for user:", user.leetcodeUsername);
            } catch (mpErr) {
              console.error("[PROFILE] Mastery path generation failed:", mpErr.message);
            }
          }

          await User.updateOne({ _id: req.user._id }, updateOp);
          console.log("[PROFILE] Background refresh complete for", user.leetcodeUsername);
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

/**
 * POST /users/refresh
 * Synchronously fetches fresh LeetCode data and returns the updated profile.
 * Pass { force: true } in the request body to force mastery path regeneration
 * even if one already exists.
 */
exports.refreshUserData = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).lean();
    if (!user || !user.leetcodeUsername) {
      return res.status(400).json({ message: "No LeetCode username set" });
    }

    const forceMastery = req.body?.force === true;

    // Fetch fresh data synchronously (waits for LeetCode API)
    const { stats: freshStats, contestRating, contestRanking, contestPercentile, submissionCalendar, contestHistory } =
      await fetchAllUserData(user.leetcodeUsername);

    const score = calculateScore(freshStats.easy, freshStats.medium, freshStats.hard);

    const updateOp = {
      $set: {
        stats: {
          easy: freshStats.easy,
          medium: freshStats.medium,
          hard: freshStats.hard,
          total: freshStats.total,
          score,
        },
        submissionCalendar,
        lastUpdated: new Date(),
      },
    };

    // Replace full contest history if fetched successfully, otherwise fall back to incremental append
    if (contestHistory?.length > 0) {
      updateOp.$set.contestHistory = contestHistory;
      updateOp.$set.contestRating = contestHistory[contestHistory.length - 1].rating;
    } else if (contestRating > 0) {
      const lastEntry = user.contestHistory?.[user.contestHistory.length - 1];
      const ratingChanged = !lastEntry || lastEntry.rating !== contestRating;
      if (ratingChanged) {
        updateOp.$push = {
          contestHistory: {
            rating: contestRating,
            date: new Date(),
            rank: contestRanking || 0,
            percentile: contestPercentile || 0,
          }
        };
        updateOp.$set.contestRating = contestRating;
      }
    }

    // Generate mastery path if missing OR if force flag is set
    if (!user.masteryPath || forceMastery) {
      try {
        const tags = await fetchRecentSubmissionTags(user.leetcodeUsername);
        const masteryPath = await generateMasteryPath(freshStats, tags);
        updateOp.$set.masteryPath = masteryPath;
        console.log("[REFRESH] Mastery path regenerated for", user.leetcodeUsername, "| level:", masteryPath.level);
      } catch (mpErr) {
        console.error("[REFRESH] Mastery path generation failed:", mpErr.message);
      }
    }

    await User.updateOne({ _id: req.user._id }, updateOp);

    // Return the updated profile
    const updatedUser = await User.findById(req.user._id).lean();
    const updatedCalendar = mapToObject(updatedUser.submissionCalendar);

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      leetcodeUsername: updatedUser.leetcodeUsername,
      stats: updatedUser.stats || { easy: 0, medium: 0, hard: 0, total: 0, score: 0 },
      contestRating: updatedUser.contestRating || 0,
      contestHistory: updatedUser.contestHistory || [],
      submissionCalendar: updatedCalendar,
      bountyPoints: updatedUser.bountyPoints || 0,
      masteryPath: updatedUser.masteryPath || null,
      lastUpdated: updatedUser.lastUpdated,
    });

    console.log("[REFRESH] Sync refresh complete for", user.leetcodeUsername);
  } catch (error) {
    console.error("[REFRESH] Error:", error.message);
    res.status(500).json({ message: "Failed to refresh data: " + error.message });
  }
};

exports.getUserGroups = async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user._id })
      .select("inviteCode name createdBy members")
      .populate("members", "name")
      .lean();
    res.json(groups);
  } catch (error) {
    console.error("[GET GROUPS] Error:", error.message);
    res.status(500).json({ message: "Failed to fetch groups" });
  }
};

exports.getLeetCodeTotals = async (req, res) => {
  try {
    const totals = await fetchLeetCodeTotals();
    res.status(200).json(successResponse(totals, "LeetCode totals fetched successfully", 200));
  } catch (error) {
    console.error("[GET LEETCODE TOTALS] Error:", error.message);
    res.status(500).json(errorResponse(error.message || "Failed to fetch LeetCode totals", 500));
  }
};
