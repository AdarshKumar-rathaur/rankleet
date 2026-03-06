const cron = require("node-cron");
const fetchLeetCodeStats = require("./leetcodeService");
const calculateScore = require("../utils/scoreCalculator");

let cronTask = null;

const refreshLeetCodeStats = () => {
  // Stop existing task if any
  if (cronTask) {
    cronTask.stop();
  }

  cronTask = cron.schedule("*/30 * * * *", async () => {
    console.log("[CRON] Refreshing LeetCode stats...");
    try {
      const User = require("../models/User");
      const users = await User.find().lean();

      for (let user of users) {
        try {
          if (!user.leetcodeUsername) {
            console.log("[CRON] Skipping user with no leetcodeUsername:", user._id);
            continue;
          }

          const stats = await fetchLeetCodeStats(user.leetcodeUsername);
          const score = calculateScore(stats.easy, stats.medium, stats.hard);

          await User.updateOne(
            { _id: user._id },
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
        } catch (error) {
          console.error("[CRON] Failed updating user:", user.leetcodeUsername, error.message);
        }
      }
      console.log("[CRON] LeetCode stats refresh completed.");
    } catch (error) {
      console.error("[CRON] Critical error:", error.message);
    }
  });
};

module.exports = refreshLeetCodeStats;