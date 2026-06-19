const AIActivity = require("../models/AIActivity");
const Group = require("../models/Group");
const User = require("../models/User");
const {
  successResponse,
  errorResponse,
} = require("../utils/responseFormatter");
const { GoogleGenAI } = require("@google/genai");

// Helper function to pause execution during retries
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Generate AI Roast & Hype using LLM
 */
async function generateAIMessage(groupStats, type = "hype") {
  try {
    const apiKey = process.env.LLM_API_KEY;
    const provider = process.env.LLM_PROVIDER || "openai";

    if (!apiKey) {
      console.warn("LLM_API_KEY not set. Using mock response.");
      return getMockAIMessage(groupStats, type);
    }

    let prompt = "";

    if (type === "roast") {
      prompt = `You are a witty gaming roaster. Generate a short, funny roast (2-3 sentences) about this LeetCode group's weekly performance. Make it gaming-style and humorous, not mean-spirited:
      
Group: ${groupStats.groupName}
Members: ${groupStats.members}
Total Problems Solved: ${groupStats.totalProblems}
Top Performer: ${groupStats.topPerformer}

Keep it under 150 characters. Be playful!`;
    } else if (type === "hype") {
      prompt = `You are a hype man for competitive programmers. Generate an energetic, motivational message (2-3 sentences) to pump up this LeetCode group. Use gaming/esports language:

Group: ${groupStats.groupName}
Members: ${groupStats.members}
Total Problems Solved: ${groupStats.totalProblems}
Top Performer: ${groupStats.topPerformer}

Keep it under 200 characters. Use emojis sparingly!`;
    } else {
      prompt = `Generate a brief insight (1-2 sentences) about this LeetCode group's performance trends:

Group: ${groupStats.groupName}
Members: ${groupStats.members}
Total Problems Solved: ${groupStats.totalProblems}
Top Performer: ${groupStats.topPerformer}

Keep it under 150 characters.`;
    }

    if (provider === "google") {
      return await callGoogleGemini(apiKey, prompt);
    } else if (provider === "openai") {
      return await callOpenAI(apiKey, prompt);
    } else if (provider === "anthropic") {
      return await callAnthropic(apiKey, prompt);
    } else if (provider === "cohere") {
      return await callCohere(apiKey, prompt);
    }

    return getMockAIMessage(groupStats, type);
  } catch (err) {
    console.error("AI message generation error:", err);
    return getMockAIMessage(groupStats, type);
  }
}

/**
 * Robust caller for Google Gemini with exponential backoff retries for 503/429 spikes
 */
async function callGoogleGemini(apiKey, prompt, retries = 3) {
  const ai = new GoogleGenAI({ apiKey });

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });
      return res.text.trim();
    } catch (err) {
      const status = err.status || (err.error && err.error.code);

      // Retry if server is unavailable (503) or rate limited (429)
      if ((status === 503 || status === 429) && attempt < retries - 1) {
        const waitTime = Math.pow(2, attempt) * 1000; // 1s, then 2s
        console.warn(
          `[GEMINI] API warning (${status}). Retrying in ${waitTime}ms... (Attempt ${attempt + 1}/${retries})`,
        );
        await sleep(waitTime);
        continue;
      }

      // If it's another error or we ran out of retries, bubble up the error to trigger mock fallback
      throw err;
    }
  }
}

async function callOpenAI(apiKey, prompt) {
  const axios = require("axios");
  const res = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 200,
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    },
  );
  return res.data.choices[0].message.content.trim();
}

async function callAnthropic(apiKey, prompt) {
  const axios = require("axios");
  const res = await axios.post(
    "https://api.anthropic.com/v1/messages",
    {
      model: "claude-3-haiku-20240307",
      max_tokens: 200,
      messages: [{ role: "user", content: prompt }],
    },
    {
      headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
    },
  );
  return res.data.content[0].text.trim();
}

async function callCohere(apiKey, prompt) {
  const axios = require("axios");
  const res = await axios.post(
    "https://api.cohere.ai/v1/generate",
    {
      prompt: prompt,
      max_tokens: 200,
      temperature: 0.7,
    },
    {
      headers: { Authorization: `Bearer ${apiKey}` },
    },
  );
  return res.data.generations[0].text.trim();
}

function getMockAIMessage(groupStats, type) {
  const roasts = [
    `🎮 ${groupStats.groupName}? More like ${groupStats.groupName}... but with problems solved! Keep grinding!`,
    `Yo, ${groupStats.topPerformer} carrying ${groupStats.groupName} like a true legend. ${groupStats.totalProblems} problems down! 🔥`,
  ];
  const hypes = [
    `🔥 ${groupStats.groupName} is POPPING OFF! ${groupStats.totalProblems} problems solved this week! The momentum is REAL!`,
    `🚀 SHOUTOUT to ${groupStats.topPerformer} leading the charge with amazing stats!`,
  ];
  const insights = [
    `📊 ${groupStats.groupName} is averaging solid problems per member. Keep it up!`,
    `💡 ${groupStats.topPerformer} is carrying the team. Time for others to step up!`,
  ];

  const messages =
    type === "roast" ? roasts : type === "hype" ? hypes : insights;
  return messages[Math.floor(Math.random() * messages.length)];
}

exports.getActivityFeed = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    // Support both _id and id depending on how your auth middleware attaches the user object
    const userId = req.user._id || req.user.id;

    // 1. Fetch the groups the user is a member of
    const userGroups = await Group.find({ members: userId }).select("_id");

    // 2. Handle empty state: If user is in 0 groups, return empty array immediately
    if (!userGroups || userGroups.length === 0) {
      return res
        .status(200)
        .json(successResponse([], "Activity feed retrieved", 200));
    }

    // 3. Extract just the ObjectIds from the group results
    const userGroupIds = userGroups.map((group) => group._id);

    // 4. Filter AI activities using the $in operator against the user's groups
    const activities = await AIActivity.find({ group: { $in: userGroupIds } })
      .populate("group", "name")
      .sort({ createdAt: -1 })
      .limit(limit);

    res
      .status(200)
      .json(successResponse(activities, "Activity feed retrieved", 200));
  } catch (err) {
    console.error("Feed Error:", err);
    res
      .status(500)
      .json(errorResponse(err.message || "Failed to fetch feed", 500));
  }
};

exports.getActivityByGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id || req.user._id;
    const limit = req.query.limit || 5;

    const group = await Group.findById(groupId);
    if (!group || !group.members.includes(userId)) {
      return res
        .status(403)
        .json(errorResponse("Not a member of this group", 403));
    }

    const activities = await AIActivity.find({ group: groupId })
      .populate("group", "name")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res
      .status(200)
      .json(successResponse(activities, "Group activities retrieved", 200));
  } catch (err) {
    console.error("Group Activity Error:", err);
    res
      .status(500)
      .json(
        errorResponse(err.message || "Failed to fetch group activity", 500),
      );
  }
};

/**
 * CORE LOGIC: Generate Weekly Activity (Callable internally or via API)
 */
exports.generateActivityLogic = async (groupId, type = "hype") => {
  const group = await Group.findById(groupId).populate("members");
  if (!group) throw new Error("Group not found");

  let totalProblems = 0;
  let totalPoints = 0;
  let topPerformer = "Team";
  let maxProblems = 0;

  const memberStats = await Promise.all(
    group.members.map(async (member) => {
      const solved = member.stats?.total || 0;
      const points = member.stats?.score || 0;

      totalProblems += solved;
      totalPoints += points;

      if (solved > maxProblems) {
        maxProblems = solved;
        topPerformer = member.name;
      }
      return { name: member.name, solved, points };
    }),
  );

  const groupStats = {
    groupName: group.name,
    members: group.members.length,
    totalProblems,
    totalPoints,
    topPerformer,
    topPerformerStats: memberStats.find((m) => m.name === topPerformer) || {},
  };

  const aiContent = await generateAIMessage(groupStats, type);

  const activity = new AIActivity({
    type,
    content: aiContent,
    group: groupId,
    generatedFrom: { weeklyStats: groupStats },
    aiModel:
      process.env.LLM_PROVIDER === "google"
        ? "gemini-2.5-flash"
        : process.env.LLM_PROVIDER || "gpt-3.5-turbo",
  });

  await activity.save();
  await activity.populate("group", "name");

  // Keep only the 10 most recent activity logs for this group
  const allGroupActivities = await AIActivity.find({ group: groupId })
    .sort({ createdAt: -1 })
    .skip(10)
    .select("_id");

  if (allGroupActivities.length > 0) {
    const idsToDelete = allGroupActivities.map((a) => a._id);
    await AIActivity.deleteMany({ _id: { $in: idsToDelete } });
    console.log(
      `[AI-ACTIVITY] Cleaned up ${idsToDelete.length} old activities for group ${groupId}`,
    );
  }

  return activity;
};

/**
 * Express Route Wrapper for Manual Generation
 */
exports.generateWeeklyActivity = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { type = "hype" } = req.body;

    const activity = await exports.generateActivityLogic(groupId, type);
    res.status(201).json(successResponse(activity, "Weekly activity generated", 201));
  } catch (err) {
    console.error("AI Generation Error:", err);
    const status = err.message === "Group not found" ? 404 : 500;
    res.status(status).json(errorResponse(err.message || "Failed to generate AI message", status));
  }
};

exports.likeActivity = async (req, res) => {
  try {
    const { activityId } = req.params;
    const userId = req.user.id || req.user._id;

    const activity = await AIActivity.findById(activityId);
    if (!activity) {
      return res.status(404).json(errorResponse("Activity not found", 404));
    }

    if (!activity.likedBy.includes(userId)) {
      activity.likedBy.push(userId);
      activity.likeCount += 1;
      await activity.save();
    }

    res.status(200).json(successResponse(activity, "Activity liked", 200));
  } catch (err) {
    console.error("Like Error:", err);
    res.status(500).json(errorResponse(err.message || "Failed to like activity", 500));
  }
};

exports.deleteActivityOfGroup = async (groupId) => {
  try {
    await AIActivity.deleteMany({ group: groupId });
    return successResponse(null, "Activities deleted", 200);
  } catch (err) {
    console.error("Delete Activity Error:", err);
    return errorResponse(err.message || "Failed to delete activities", 500);
  }
};