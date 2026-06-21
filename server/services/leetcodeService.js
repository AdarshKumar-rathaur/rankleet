const axios = require("axios");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Single GraphQL request to LeetCode with 429 retry backoff.
 * LeetCode only accepts ONE root field per query.
 */
async function leetcodeRequest(query, variables, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await axios.post(
        "https://leetcode.com/graphql",
        { query, variables },
        {
          headers: {
            "Content-Type": "application/json",
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            Referer: "https://leetcode.com",
          },
          timeout: 15000,
          maxRedirects: 5,
        }
      );

      const errors = response.data?.errors;
      if (errors?.length) {
        const isRateLimit = errors.some(
          (e) =>
            e.message?.toLowerCase().includes("too many") ||
            e.message?.toLowerCase().includes("rate limit")
        );
        if (isRateLimit) {
          const wait = 2000 * (attempt + 1);
          console.warn(`[LC] Rate limited, retrying in ${wait}ms…`);
          await sleep(wait);
          continue;
        }
        // Log non-rate-limit errors but don't throw — return partial data
        console.warn("[LC] GraphQL errors:", JSON.stringify(errors).slice(0, 300));
      }

      return response.data;
    } catch (err) {
      if (err.response?.status === 429) {
        const wait = 3000 * (attempt + 1);
        console.warn(`[LC] 429 received, retrying in ${wait}ms…`);
        await sleep(wait);
        continue;
      }
      if (err.response) {
        console.error(
          `[LC] HTTP ${err.response.status}:`,
          JSON.stringify(err.response.data).slice(0, 300)
        );
      }
      throw err;
    }
  }
  throw new Error("LeetCode API rate limit exceeded after retries");
}

// ── Stats ─────────────────────────────────────────────────────────────────────

const fetchLeetCodeStats = async (username) => {
  if (!username?.trim()) throw new Error("Invalid username");

  const data = await leetcodeRequest(
    `query getStats($username: String!) {
      matchedUser(username: $username) {
        submitStats {
          acSubmissionNum { difficulty count }
        }
      }
    }`,
    { username: username.trim() }
  );

  let easy = 0, medium = 0, hard = 0, total = 0;
  const acList = data?.data?.matchedUser?.submitStats?.acSubmissionNum || [];
  acList.forEach((item) => {
    if (item.difficulty === "Easy") easy = item.count;
    else if (item.difficulty === "Medium") medium = item.count;
    else if (item.difficulty === "Hard") hard = item.count;
    else if (item.difficulty === "All") total = item.count;
  });

  return { easy, medium, hard, total };
};

// ── Contest rating ─────────────────────────────────────────────────────────────
// Correct fields: rating, globalRanking, topPercentage

const fetchContestRating = async (username) => {
  if (!username?.trim()) return { rating: 0, ranking: 0, percentile: 0 };

  try {
    const data = await leetcodeRequest(
      `query getContestRating($username: String!) {
        userContestRanking(username: $username) {
          rating
          globalRanking
          topPercentage
        }
      }`,
      { username: username.trim() }
    );

    const cr = data?.data?.userContestRanking;
    if (!cr) return { rating: 0, ranking: 0, percentile: 0 };
    return {
      rating: Math.round(cr.rating || 0),
      ranking: cr.globalRanking || 0,
      percentile: cr.topPercentage || 0,
    };
  } catch {
    return { rating: 0, ranking: 0, percentile: 0 };
  }
};

// ── Submission calendar ────────────────────────────────────────────────────────
// Correct query: matchedUser(username).userCalendar(year: YYYY).submissionCalendar
// Fetch current year + previous year and merge for a full 12-month view.

const fetchSubmissionCalendar = async (username) => {
  if (!username?.trim()) return {};

  const user = username.trim();
  const currentYear = new Date().getFullYear();
  const prevYear = currentYear - 1;

  const calQuery = `query getCalendar($username: String!, $year: Int!) {
    matchedUser(username: $username) {
      userCalendar(year: $year) {
        submissionCalendar
      }
    }
  }`;

  const merged = {};

  // Fetch both years in parallel
  const [curData, prevData] = await Promise.allSettled([
    leetcodeRequest(calQuery, { username: user, year: currentYear }),
    leetcodeRequest(calQuery, { username: user, year: prevYear }),
  ]);

  for (const result of [prevData, curData]) {
    if (result.status === "fulfilled") {
      const calStr = result.value?.data?.matchedUser?.userCalendar?.submissionCalendar;
      if (calStr && calStr !== "{}") {
        try {
          const parsed = JSON.parse(calStr);
          Object.assign(merged, parsed);
        } catch {
          // ignore parse errors
        }
      }
    }
  }

  return merged;
};

const fetchContestHistory = async (username) => {
  if (!username?.trim()) return [];

  try {
    const data = await leetcodeRequest(
      `query getContestHistory($username: String!) {
        userContestRankingHistory(username: $username) {
          attended
          rating
          ranking
          contest {
            title
            startTime
          }
        }
      }`,
      { username: username.trim() }
    );

    const history = data?.data?.userContestRankingHistory;
    if (!Array.isArray(history)) return [];

    return history
      .filter((e) => e.attended && e.rating > 0)
      .map((e) => ({
        rating: Math.round(e.rating),
        rank: e.ranking || 0,
        date: new Date(e.contest.startTime * 1000).toISOString(),
        title: e.contest.title || "",
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  } catch (err) {
    console.warn("[LC] fetchContestHistory failed:", err.message);
    return [];
  }
};

// ── Batched fetch (sequential, one root field each) ───────────────────────────

const fetchAllUserData = async (username) => {
  if (!username?.trim()) throw new Error("Invalid username");

  const user = username.trim();

  const stats = await fetchLeetCodeStats(user);
  await sleep(300);
  const contestData = await fetchContestRating(user);
  await sleep(300);
  const submissionCalendar = await fetchSubmissionCalendar(user);
  await sleep(300);
  const contestHistory = await fetchContestHistory(user);

  return {
    stats,
    contestRating: contestData.rating,
    contestRanking: contestData.ranking,
    contestPercentile: contestData.percentile,
    submissionCalendar,
    contestHistory,
  };
};

module.exports = {
  fetchLeetCodeStats,
  fetchAllUserData,
  fetchContestRating,
  fetchContestHistory,
  fetchSubmissionCalendar,
};
