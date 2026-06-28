const mongoose = require("mongoose");
const Bounty = require("../models/Bounty");
const Group = require("../models/Group");
const User = require("../models/User");
const { fetchLeetCodeStats } = require("../services/leetcodeService");
const { successResponse, errorResponse } = require("../utils/responseFormatter");

const VALID_OBJECTIVE_TYPES = ["EASY", "MEDIUM", "HARD", "TOTAL"];

const calculateObjectiveDelta = (objectiveType, currentStats, startingStats) => {
  const key = objectiveType.toLowerCase();
  const currentValue = Math.max(0, currentStats?.[key] || 0);
  const startValue = Math.max(0, startingStats?.[key] || 0);
  return Math.max(0, currentValue - startValue);
};

const normalizeStats = (stats) => ({
  easy: Number(stats.easy || 0),
  medium: Number(stats.medium || 0),
  hard: Number(stats.hard || 0),
  total: Number(stats.total || 0),
});

exports.createBounty = async (req, res) => {
  try {
    const { groupId, title, objectiveType, targetAmount, deadline } = req.body;
    const userId = req.user._id;

    if (!groupId || !title || !objectiveType || !targetAmount || !deadline) {
      return res.status(400).json(errorResponse("Missing required bounty fields", 400));
    }

    if (!VALID_OBJECTIVE_TYPES.includes(objectiveType)) {
      return res.status(400).json(errorResponse("Invalid objective type", 400));
    }

    const deadlineDate = new Date(deadline);
    if (isNaN(deadlineDate.getTime())) {
      return res.status(400).json(errorResponse("Invalid deadline", 400));
    }

    // Interpret the selected date as the full day, with deadline at the next midnight UTC.
    deadlineDate.setUTCHours(0, 0, 0, 0);
    deadlineDate.setUTCDate(deadlineDate.getUTCDate() + 1);

    if (deadlineDate <= new Date()) {
      return res.status(400).json(errorResponse("Bounty deadline must be in the future", 400));
    }

    const group = await Group.findById(groupId);
    if (!group || !group.members.some(memberId => memberId.toString() === userId.toString())) {
      return res.status(403).json(errorResponse("Not a member of this group", 403));
    }

    const bounty = new Bounty({
      group: groupId,
      title,
      objectiveType,
      targetAmount,
      deadline: deadlineDate,
    });

    await bounty.save();

    res.status(201).json(successResponse(bounty, "Bounty created successfully", 201));
  } catch (err) {
    res.status(500).json(errorResponse(err.message, 500));
  }
};

exports.getBountiesByGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    // 1. Group membership validation
    const group = await Group.findById(groupId);
    if (!group || !group.members.some(memberId => memberId.toString() === userId.toString())) {
      return res.status(403).json(errorResponse("Not a member of this group", 403));
    }

    // 2. Fetch all matching bounties
    const bounties = await Bounty.find({ group: groupId })
      .populate("participants.user", "name leetcodeUsername bountyPoints")
      .sort({ createdAt: -1 });

    // 3. Dynamic runtime status syncing
    const now = new Date();
    const processedBounties = bounties.map(bounty => {
      const bountyObj = bounty.toObject(); // Convert Mongoose Document to plain JS Object
      
      // If the deadline passed but the DB still says "OPEN", override it for the client
      if (bountyObj.status === "OPEN" && now >= new Date(bountyObj.deadline)) {
        bountyObj.status = "RESOLVED";
      }
      
      return bountyObj;
    });

    res.status(200).json(successResponse(processedBounties, "Bounties retrieved successfully", 200));
  } catch (err) {
    res.status(500).json(errorResponse(err.message, 500));
  }
};

exports.joinBounty = async (req, res) => {
  const MAX_RETRIES = 3;
  const { id: bountyId } = req.params;
  const { wager } = req.body;
  const userId = req.user._id;

  if (!wager || wager < 1) {
    return res.status(400).json(errorResponse("Invalid wager amount", 400));
  }

  try {
    const initialUser = await User.findById(userId);
    if (!initialUser) {
      return res.status(404).json(errorResponse("User not found", 404));
    }

    const rawStats = await fetchLeetCodeStats(initialUser.leetcodeUsername);
    const startingStats = normalizeStats(rawStats);

    // STEP 3: Begin retry loop for strict database transaction execution
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      const session = await mongoose.startSession();
      try {
        let savedBounty = null;

        await session.withTransaction(async () => {
          // Re-verify documents within transaction boundary to secure data consistency
          const user = await User.findById(userId).session(session);
          const bounty = await Bounty.findById(bountyId).session(session);

          if (!user) throw new Error("User not found");
          if (!bounty) throw new Error("Bounty not found");
          if (bounty.status !== "OPEN") throw new Error("Bounty is not open for joining");
          
          // Strict validation against the normalised midnight deadline
          if (new Date() >= bounty.deadline) {
            throw new Error("Bounty deadline has already passed");
          }

          if (bounty.participants.some((p) => p.user.toString() === userId.toString())) {
            throw new Error("Already joined this bounty");
          }

          if ((user.bountyPoints || 0) < wager) {
            throw new Error("Insufficient bounty points");
          }

          // Apply balance adjustments
          user.bountyPoints -= wager;
          bounty.totalPool += wager;
          bounty.participants.push({
            user: user._id,
            wager,
            startingStats, // Safely injected here from Step 2
            completed: false,
          });

          await user.save({ session });
          await bounty.save({ session });

          savedBounty = bounty;
        });

        session.endSession();

        if (savedBounty) {
          await savedBounty.populate("participants.user", "name leetcodeUsername");
          return res.status(200).json(successResponse(savedBounty, "Joined bounty successfully", 200));
        }

        return res.status(500).json(errorResponse("Failed to join bounty", 500));
      } catch (err) {
        session.endSession();
        const msg = err.message || String(err);

        // Map expected validation errors to 4xx status types
        if (msg.includes("User not found")) return res.status(404).json(errorResponse(msg, 404));
        if (msg.includes("Bounty not found")) return res.status(404).json(errorResponse(msg, 404));
        if (msg.includes("Bounty is not open")) return res.status(400).json(errorResponse(msg, 400));
        if (msg.includes("deadline has already passed")) return res.status(400).json(errorResponse(msg, 400));
        
        if (msg.includes("Already joined")) {
          try {
            const current = await Bounty.findById(bountyId).populate("participants.user", "name leetcodeUsername");
            return res.status(200).json(successResponse(current, "Already joined this bounty", 200));
          } catch (e) {
            return res.status(200).json(successResponse(null, "Already joined this bounty", 200));
          }
        }
        if (msg.includes("Insufficient bounty points")) return res.status(400).json(errorResponse(msg, 400));

        // Exponential backoff logic for handling concurrent cluster collisions
        const isTransient = /WriteConflict|TransientTransactionError|unknown transaction commit result/i.test(msg);
        if (attempt < MAX_RETRIES && isTransient) {
          await new Promise((r) => setTimeout(r, 100 * attempt));
          continue;
        }

        return res.status(500).json(errorResponse(msg, 500));
      }
    }
  } catch (globalErr) {
    return res.status(500).json(errorResponse(globalErr.message, 500));
  }
};

exports.resolveBounties = async (req, res) => {
  try {
    // 1. Safe Token Verification Setup
    if (!process.env.CRON_SECRET || process.env.CRON_SECRET.length < 16) {
      return res.status(500).json(errorResponse("CRON_SECRET not properly configured", 500));
    }

    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    
    if (!token) {
      return res.status(403).json(errorResponse("Invalid cron authorization", 403));
    }

    const tokenBuffer = Buffer.from(token);
    const secretBuffer = Buffer.from(process.env.CRON_SECRET);

    // FIX: Guard against length mismatch before timingSafeEqual to avoid server crash
    if (tokenBuffer.length !== secretBuffer.length || !require('crypto').timingSafeEqual(tokenBuffer, secretBuffer)) {
      return res.status(403).json(errorResponse("Invalid cron authorization", 403));
    }

    // 2. Fetch target expired records
    const now = new Date();
    const openBounties = await Bounty.find({ deadline: { $lt: now }, status: "OPEN" }).populate(
      "participants.user",
      "bountyPoints name leetcodeUsername"
    );

    const results = [];

    // 3. Process each bounty independently
    for (const bounty of openBounties) {
      const participantUpdates = [];

      // Fetch LeetCode statistics OUTSIDE transaction using controlled sequencing
      for (const participant of bounty.participants) {
        try {
          const currentStats = normalizeStats(await fetchLeetCodeStats(participant.user.leetcodeUsername));
          const delta = calculateObjectiveDelta(bounty.objectiveType, currentStats, participant.startingStats);
          const completed = delta >= bounty.targetAmount;
          
          participantUpdates.push({
            userId: participant.user._id.toString(),
            wager: participant.wager,
            completed
          });
        } catch (apiErr) {
          // Fallback logic if LeetCode API fails for a single user
          participantUpdates.push({
            userId: participant.user._id.toString(),
            wager: participant.wager,
            completed: false
          });
        }
      }

      const winners = participantUpdates.filter((entry) => entry.completed);
      const payout = winners.length > 0 ? Math.ceil(bounty.totalPool / winners.length) : 0;

      const MAX_RETRIES = 3;
      let resolved = false;

      // 4. Begin isolation transaction boundary
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        const session = await mongoose.startSession();
        try {
          await session.withTransaction(async () => {
            // FIX: Load document FRESH within the transaction lock
            const txnBounty = await Bounty.findById(bounty._id).session(session);
            if (!txnBounty || txnBounty.status !== "OPEN") return;

            // FIX: Map completion metrics accurately on the fresh transaction document
            for (const participant of txnBounty.participants) {
              const matchingUpdate = participantUpdates.find(u => u.userId === participant.user.toString());
              if (matchingUpdate) {
                participant.completed = matchingUpdate.completed;
              }
            }

            // Distribute points safely
            if (winners.length === 0) {
              for (const entry of participantUpdates) {
                const participantUser = await User.findById(entry.userId).session(session);
                if (participantUser) {
                  participantUser.bountyPoints = (participantUser.bountyPoints || 0) + entry.wager;
                  await participantUser.save({ session });
                }
              }
            } else {
              for (const entry of winners) {
                const participantUser = await User.findById(entry.userId).session(session);
                if (participantUser) {
                  participantUser.bountyPoints = (participantUser.bountyPoints || 0) + payout;
                  await participantUser.save({ session });
                }
              }
            }

            txnBounty.status = "RESOLVED";
            await txnBounty.save({ session });
          });

          session.endSession();
          results.push({ bountyId: bounty._id, resolved: true, winners: winners.length, payoutPerWinner: payout });
          resolved = true;
          break;
        } catch (err) {
          session.endSession();
          const msg = err.message || String(err);
          const isTransient = /WriteConflict|TransientTransactionError|unknown transaction commit result/i.test(msg);
          
          if (attempt < MAX_RETRIES && isTransient) {
            await new Promise((r) => setTimeout(r, 200 * attempt));
            continue;
          }
          
          results.push({ bountyId: bounty._id, resolved: false, error: msg });
          break;
        }
      }

      if (!resolved && results.every((r) => String(r.bountyId) !== String(bounty._id))) {
        results.push({ bountyId: bounty._id, resolved: false, error: "Transaction retry exhaustion threshold hit." });
      }
    }

    res.status(200).json(successResponse(results, "Bounty resolution complete", 200));
  } catch (err) {
    res.status(500).json(errorResponse(err.message, 500));
  }
};