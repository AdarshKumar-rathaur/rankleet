const cron = require("node-cron");
const fetchLeetCodeStats = require("./leetcodeService");
const calculateScore = require("../utils/scoreCalculator");

let cronTask = null;
let weeklyAITask = null;

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

  // Generate weekly AI activities every Monday at 9 AM
  if (weeklyAITask) {
    weeklyAITask.stop();
  }

  weeklyAITask = cron.schedule("0 9 * * 1", async () => {
    console.log("[CRON-AI] Generating weekly roast & hype messages...");
    try {
      const Group = require("../models/Group");
      const { generateActivityLogic } = require("../controllers/aiActivityController");
      
      const groups = await Group.find().lean();
      const types = ["roast", "hype", "insight"];

      for (let group of groups) {
        try {
          const type = types[Math.floor(Math.random() * types.length)];
          const groupFull = await Group.findById(group._id).populate("members");
          
          if (groupFull && groupFull.members.length > 0) {
            // Execute the newly separated logic function
            await generateActivityLogic(group._id, type);
            console.log(`[CRON-AI] Generated ${type} for group: ${group.name}`);
          }
        } catch (error) {
          console.error("[CRON-AI] Failed for group:", group.name, error.message);
        }
      }

      console.log("[CRON-AI] Weekly AI generation completed.");
    } catch (error) {
      console.error("[CRON-AI] Critical error:", error.message);
    }
  });

  console.log("[CRON] Weekly AI task scheduled for Mondays at 9 AM");
};

module.exports = refreshLeetCodeStats;