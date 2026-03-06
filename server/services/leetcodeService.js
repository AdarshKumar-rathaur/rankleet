const axios = require("axios");

const fetchLeetCodeStats = async (username) => {
  try {
    if (!username || username.trim().length === 0) {
      throw new Error("Invalid username");
    }

    const query = {
      query: `
        query getUserProfile($username: String!) {
            matchedUser(username: $username) {
                submitStats {
                    acSubmissionNum {
                        difficulty
                        count
                    }
                }
            }
        }
      `,
      variables: { username: username.trim() }
    };

    const response = await axios.post("https://leetcode.com/graphql", query, {
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 10000,
      maxRedirects: 5
    });

    if (!response.data.data || !response.data.data.matchedUser) {
      throw new Error("User not found on LeetCode");
    }

    const stats = response.data.data.matchedUser.submitStats.acSubmissionNum;
    let easy = 0, medium = 0, hard = 0, total = 0;

    stats.forEach(item => {
      if (item.difficulty === "Easy")
        easy = item.count;
      else if (item.difficulty === "Medium")
        medium = item.count;
      else if (item.difficulty === "Hard")
        hard = item.count;
      else if (item.difficulty === "All")
        total = item.count;
    });

    return { easy, medium, hard, total };
  } catch (error) {
    console.error("LeetCode fetch error:", error.message);
    throw new Error(`Failed to fetch LeetCode stats: ${error.message}`);
  }
};

module.exports = fetchLeetCodeStats;
