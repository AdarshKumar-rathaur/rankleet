const axios = require("axios");

/**
 * Fetch total problem counts from LeetCode (Easy/Medium/Hard).
 * Returns cached values if the API call fails.
 */

// In-memory cache to avoid hammering LeetCode
let cache = null;
let cacheTime = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

const fetchLeetCodeTotals = async () => {
  // Return cached value if fresh
  if (cache && Date.now() - cacheTime < CACHE_TTL) {
    return cache;
  }

  const query = `
    query problemsetQuestionList {
      allQuestionsCount {
        difficulty
        count
      }
    }
  `;

  try {
    const response = await axios.post(
      "https://leetcode.com/graphql",
      { query },
      {
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (compatible; RankLeet/1.0)",
        },
        timeout: 10000,
      }
    );

    const allCounts = response.data?.data?.allQuestionsCount || [];

    let easy = 0;
    let medium = 0;
    let hard = 0;
    let total = 0;

    allCounts.forEach((item) => {
      if (item.difficulty === "Easy") easy = item.count;
      else if (item.difficulty === "Medium") medium = item.count;
      else if (item.difficulty === "Hard") hard = item.count;
      else if (item.difficulty === "All") total = item.count;
    });

    // Fallback total
    if (!total) total = easy + medium + hard;

    const result = { easy, medium, hard, total };

    // Cache the result
    cache = result;
    cacheTime = Date.now();

    return result;
  } catch (err) {
    console.warn("[TOTALS] Failed to fetch LeetCode totals:", err.message);

    // Return cached value even if stale, or fallback defaults
    if (cache) return cache;

    return { easy: 900, medium: 1900, hard: 850, total: 3650 };
  }
};

module.exports = fetchLeetCodeTotals;
