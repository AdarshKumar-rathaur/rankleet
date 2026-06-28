const cron = require("node-cron");
const { fetchAllUserData } = require("./leetcodeService");
const calculateScore = require("../utils/scoreCalculator");
const generateMasteryPath = require("./masteryPathService");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let cronTask = null;
let weeklyAITask = null;
let masteryPathTask = null;
let bountyCleanupTask = null;
let bountyResolutionTask = null;

const refreshLeetCodeStats = () => {
  // ── 30-minute stats refresh ──────────────────────────────────────────────
  if (cronTask) cronTask.stop();

  cronTask = cron.schedule("*/30 * * * *", async () => {
    console.log("[CRON] Starting LeetCode stats refresh...");
    try {
      const User = require("../models/User");
      const users = await User.find().lean();

      for (const user of users) {
        try {
          if (!user.leetcodeUsername) {
            console.log("[CRON] Skipping user with no leetcodeUsername:", user._id);
            continue;
          }

          // ONE batched request per user
          const { stats, contestRating, contestRanking, contestPercentile, submissionCalendar, contestHistory } =
            await fetchAllUserData(user.leetcodeUsername);

          const score = calculateScore(stats.easy, stats.medium, stats.hard);

          const updateOp = {
            $set: {
              stats: {
                easy: stats.easy,
                medium: stats.medium,
                hard: stats.hard,
                total: stats.total,
                score,
              },
              submissionCalendar: submissionCalendar || {},
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

          await User.updateOne({ _id: user._id }, updateOp);
          console.log("[CRON] Updated:", user.leetcodeUsername);
        } catch (error) {
          console.error("[CRON] Failed updating user:", user.leetcodeUsername, error.message);
        }

        // 1 second delay between users to avoid rate limiting
        await sleep(1000);
      }

      console.log("[CRON] LeetCode stats refresh completed.");
    } catch (error) {
      console.error("[CRON] Critical error:", error.message);
    }
  });

  // ── Weekly AI activity — every Monday at 9 AM ────────────────────────────
  if (weeklyAITask) weeklyAITask.stop();

  weeklyAITask = cron.schedule("0 9 * * 1", async () => {
    console.log("[CRON-AI] Generating weekly roast & hype messages...");
    try {
      const Group = require("../models/Group");
      const AIActivity = require("../models/AIActivity");
      const { generateActivityLogic } = require("../controllers/aiActivityController");

      const groups = await Group.find().lean();
      const types = ["roast", "hype", "insight"];

      // Compute the start of this ISO week (Monday 00:00:00 UTC)
      const now = new Date();
      const dayOfWeek = now.getUTCDay(); // 0=Sun, 1=Mon…
      const monday = new Date(now);
      monday.setUTCDate(now.getUTCDate() - ((dayOfWeek + 6) % 7));
      monday.setUTCHours(0, 0, 0, 0);

      for (const group of groups) {
        try {
          // Skip if we already generated something for this group this week
          const existingThisWeek = await AIActivity.findOne({
            group: group._id,
            createdAt: { $gte: monday },
          });
          if (existingThisWeek) {
            console.log(`[CRON-AI] Already generated for group ${group.name} this week — skipping`);
            continue;
          }

          const type = types[Math.floor(Math.random() * types.length)];
          const groupFull = await Group.findById(group._id).populate("members");

          if (groupFull && groupFull.members.length > 0) {
            await generateActivityLogic(group._id, type);
            console.log(`[CRON-AI] Generated ${type} for group: ${group.name}`);

            // Keep only 10 most recent per group
            const oldMessages = await AIActivity.find({ group: group._id })
              .sort({ createdAt: -1 })
              .skip(10)
              .select("_id");

            if (oldMessages.length > 0) {
              const idsToDelete = oldMessages.map((msg) => msg._id);
              await AIActivity.deleteMany({ _id: { $in: idsToDelete } });
              console.log(
                `[CRON-AI] Cleaned up ${idsToDelete.length} old messages for group ${group.name}`
              );
            }
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

  // ── Bounty Resolution Task — Runs every hour on the hour ──────────────────
  if (bountyResolutionTask) bountyResolutionTask.stop();

  bountyResolutionTask = cron.schedule("0 * * * *", async () => {
    console.log("[CRON-BOUNTY] Checking for expired bounties to resolve...");
    try {
      const { resolveBounties } = require("../controllers/bountyController"); 
      // 1. Create fake req and res objects to mimic an HTTP connection safely
      const mockReq = {
        headers: {
          authorization: `Bearer ${process.env.CRON_SECRET}` 
        }
      };

      const mockRes = {
        status: (statusCode) => ({
          json: (data) => console.log(`[CRON-BOUNTY] Controller finished with status ${statusCode}:`, data)
        })
      };

      // 2. Call the exact logic you already wrote in your controller!
      await resolveBounties(mockReq, mockRes);
      
    } catch (cronError) {
      console.error("[CRON-BOUNTY] Wrapper error while executing resolution:", cronError.message);
    }
  });

  console.log("[CRON] Bounty resolution task scheduled for top of every hour");

  // ── Daily bounty cleanup — remove bounties more than 7 days past deadline ──
  if (bountyCleanupTask) bountyCleanupTask.stop();

  bountyCleanupTask = cron.schedule("0 3 * * *", async () => {
    console.log("[CRON-BOUNTY] Cleaning up bounties older than 7 days past deadline...");
    try {
      const Bounty = require("../models/Bounty");
      const threshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const result = await Bounty.deleteMany({ deadline: { $lt: threshold } });
      console.log(
        `[CRON-BOUNTY] Deleted ${result.deletedCount || 0} bounties older than ${threshold.toISOString()}`
      );
    } catch (error) {
      console.error("[CRON-BOUNTY] Cleanup failed:", error.message);
    }
  });

  console.log("[CRON] Bounty cleanup task scheduled for 3 AM daily");

  // ── Sunday 10 AM — regenerate mastery paths for all users ────────────────
  if (masteryPathTask) masteryPathTask.stop();

  masteryPathTask = cron.schedule("0 10 * * 0", async () => {
    console.log("[CRON-MASTERY] Regenerating mastery paths...");
    try {
      const User = require("../models/User");
      const users = await User.find().lean();

      for (const user of users) {
        try {
          if (!user.leetcodeUsername) continue;

          const stats = user.stats || { easy: 0, medium: 0, hard: 0 };
          const userName = user.leetcodeUsername || "";
          // Use empty tags array — masteryPathService handles it gracefully
          const masteryPath = await generateMasteryPath(userName, stats, []);

          await User.updateOne({ _id: user._id }, { $set: { masteryPath } });
          console.log(`[CRON-MASTERY] Generated mastery path for: ${user.leetcodeUsername}`);
        } catch (error) {
          console.error("[CRON-MASTERY] Failed for user:", user.leetcodeUsername, error.message);
        }

        // Small delay between users
        await sleep(500);
      }

      console.log("[CRON-MASTERY] Mastery path generation completed.");
    } catch (error) {
      console.error("[CRON-MASTERY] Critical error:", error.message);
    }
  });

  console.log("[CRON] Mastery path task scheduled for Sundays at 10 AM");
};

module.exports = refreshLeetCodeStats;
