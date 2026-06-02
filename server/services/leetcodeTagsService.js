const axios = require("axios");

/**
 * Fetch recent submission tags for a user from LeetCode GraphQL API.
 * Returns an array of topic tag names (strings), deduplicated.
 * Falls back to empty array on any error.
 */
const fetchRecentSubmissionTags = async (username) => {
  if (!username || username.trim().length === 0) return [];

  // Query 1: get recent AC submissions with their topic tags directly
  const query = `
    query recentSubmissions($username: String!, $limit: Int!) {
      recentAcSubmissionList(username: $username, limit: $limit) {
        titleSlug
        title
      }
    }
  `;

  try {
    const response = await axios.post(
      "https://leetcode.com/graphql",
      { query, variables: { username: username.trim(), limit: 20 } },
      {
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (compatible; RankLeet/1.0)",
          Referer: "https://leetcode.com",
        },
        timeout: 10000,
      }
    );

    const submissions = response.data?.data?.recentAcSubmissionList || [];
    if (submissions.length === 0) return [];

    // Extract meaningful keywords from slug names.
    // Slugs like "two-sum", "longest-palindromic-substring", "course-schedule-ii"
    // contain clear topic signals we can extract heuristically.
    const TOPIC_KEYWORDS = {
      // Data structures
      "array": "Array", "matrix": "Matrix", "string": "String",
      "linked-list": "Linked List", "tree": "Tree", "binary-tree": "Binary Tree",
      "graph": "Graph", "heap": "Heap", "stack": "Stack", "queue": "Queue",
      "trie": "Trie", "segment": "Segment Tree", "fenwick": "Binary Indexed Tree",

      // Algorithms
      "dynamic": "Dynamic Programming", "dp": "Dynamic Programming",
      "backtrack": "Backtracking", "dfs": "DFS", "bfs": "BFS",
      "binary-search": "Binary Search", "search": "Binary Search",
      "sort": "Sorting", "greedy": "Greedy",
      "sliding-window": "Sliding Window", "two-pointer": "Two Pointers",
      "prefix-sum": "Prefix Sum", "divide": "Divide and Conquer",
      "recursion": "Recursion", "memo": "Memoization",

      // Topics
      "hash": "Hash Table", "map": "Hash Table",
      "math": "Math", "bit": "Bit Manipulation",
      "palindrome": "String", "substring": "Sliding Window",
      "permutation": "Backtracking", "combination": "Backtracking",
      "interval": "Intervals", "schedule": "Topological Sort",
      "course": "Topological Sort", "word": "String",
      "number": "Math", "prime": "Math",
      "stock": "Dynamic Programming", "coin": "Dynamic Programming",
      "knapsack": "Dynamic Programming", "path": "DFS",
      "island": "DFS", "cycle": "Graph",
      "diameter": "Tree", "depth": "Tree", "height": "Tree",
      "lca": "Tree", "ancestor": "Tree",
      "minimum": "Greedy", "maximum": "Greedy",
      "kth": "Heap", "top-k": "Heap",
      "rotated": "Binary Search", "peak": "Binary Search",
    };

    const tags = new Set();

    submissions.forEach(({ titleSlug }) => {
      const parts = titleSlug.split("-");
      // Check individual words and bigrams from the slug
      for (let i = 0; i < parts.length; i++) {
        const word = parts[i];
        const bigram = i < parts.length - 1 ? `${parts[i]}-${parts[i + 1]}` : null;

        if (TOPIC_KEYWORDS[word]) tags.add(TOPIC_KEYWORDS[word]);
        if (bigram && TOPIC_KEYWORDS[bigram]) tags.add(TOPIC_KEYWORDS[bigram]);
      }
    });

    const result = Array.from(tags).slice(0, 10);
    console.log(`[TAGS] Extracted ${result.length} tags for ${username}:`, result);
    return result;
  } catch (err) {
    console.warn("[TAGS] Failed to fetch submission tags:", err.message);
    return [];
  }
};

module.exports = fetchRecentSubmissionTags;
