const { GoogleGenAI } = require("@google/genai");
const fetchRecentSubmissionTags = require("./leetcodeTagsService");

/**
 * Generate a mastery path for a user based on their stats and recent tags.
 * Uses Gemini if LLM_API_KEY is set, otherwise returns a smart mock.
 * Always returns a valid non-null object.
 */
const generateMasteryPath = async (userName = "", stats = {}, tags = []) => {
  const easy = stats.easy || 0;
  const medium = stats.medium || 0;
  const hard = stats.hard || 0;
  const total = easy + medium + hard;

  try {
    const apiKey = process.env.LLM_API_KEY;
    if (!apiKey) {
      console.log("[MASTERY] LLM_API_KEY not set, using smart mock");
      return buildMockMasteryPath(easy, medium, hard, tags);
    }
    if(!tags){
      tags = await fetchRecentSubmissionTags(userName) || [];
    }
    const tagList = Array.isArray(tags) && tags.length > 0
      ? tags.slice(0, 10).join(", ")
      : "arrays, strings, dynamic programming";

    const hardRatio  = (easy + medium + hard) > 0 ? (hard / (easy + medium + hard) * 100).toFixed(0) : 0;
    const medRatio   = (easy + medium + hard) > 0 ? (medium / (easy + medium + hard) * 100).toFixed(0) : 0;
    const easyRatio = 100 - medRatio - hardRatio;

    const prompt = `You are an elite competitive programming coach. Your task is to generate a HIGHLY PERSONALIZED 30-day LeetCode mastery plan for a specific student.

USER STATS:
- Easy solved: ${easy} (${easyRatio}% of total)
- Medium solved: ${medium} (${medRatio}% of total)  
- Hard solved: ${hard} (${hardRatio}% of total)
- Total problems: ${total}
- Recent topics they've been working on: ${tagList}

COACHING DIRECTIVES:
1. Progression Logic: If the student's Hard solve rate is < 10%, the primary focus MUST be bridging the gap from Medium to Hard problem-solving patterns.
2. Topic Strategy: Acknowledge their recent focus on [${tagList}] in the description, but strictly assign NEW or WEAK topics in the "steps" to fill their knowledge gaps. Avoid assigning topics they have already heavily practiced.
3. Customization: The "title" and step "descriptions" MUST dynamically reference the student's actual problem counts and ratios. No generic advice.

OUTPUT FORMAT:
Return ONLY a raw, valid JSON object. Do NOT wrap the JSON in markdown code blocks, backticks, or add any conversational text. Use this exact schema:

{
  "title": "string (e.g., 'Advanced Graph & DP Mastery for ${total}-Problem Solver')",
  "description": "string (Exactly 2 sentences. Must explicitly mention their stats and recent work in ${tagList})",
  "level": "beginner|intermediate|advanced",
  "steps": [
    {
      "day": number (Must be the starting day of the phase: 1, 7, 13, 19, or 25),
      "title": "string (Actionable phase title)",
      "description": "string (Explain exactly why THIS specific student needs this phase based on their profile)",
      "topics": ["string", "string"]
    }
  ]
}

IMPORTANT: 
- "level" MUST be exactly one of: "beginner", "intermediate", or "advanced"
- "day" MUST be a plain number (1, 7, 13, 19, 25) — no "Day" prefix
- Include exactly 5 steps spanning 30 days
- Make it feel like a coach who looked at their profile, not a generic template`;

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    // res.text may be a function or a string depending on SDK version
    let rawText = typeof response.text === "function"
      ? response.text()
      : response.text;

    if (!rawText || typeof rawText !== "string") {
      throw new Error("Empty response from Gemini");
    }

    // Strip markdown code fences if present
    rawText = rawText
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim();

    const parsed = JSON.parse(rawText);

    // Validate structure
    if (!parsed.title || !parsed.steps || !Array.isArray(parsed.steps)) {
      throw new Error("Invalid mastery path structure from LLM");
    }

    // Normalize level to one of the three valid values
    const rawLvl = (parsed.level || "").toLowerCase().trim();
    parsed.level =
      rawLvl === "beginner" ? "beginner" :
      rawLvl === "advanced" || rawLvl === "hard" || rawLvl === "expert" || rawLvl === "elite" ? "advanced" :
      "intermediate";

    // Ensure step.day is a plain number (strip "Day " prefix if LLM included it)
    parsed.steps = parsed.steps.map((s) => ({
      ...s,
      day: typeof s.day === "string"
        ? parseInt(s.day.replace(/[^0-9]/g, ""), 10) || s.day
        : s.day,
    }));

    console.log("[MASTERY] Generated via Gemini for level:", parsed.level);
    return parsed;
  } catch (err) {
    console.error("[MASTERY] LLM generation failed, falling back to mock:", err.message);
    return buildMockMasteryPath(easy, medium, hard, tags);
  }
};

/**
 * Build a genuinely personalized mastery path from stats + tags.
 * This is the fallback when no LLM API key is set — it still produces
 * a plan that's specific to this user's actual skill gaps and recent topics.
 */
function buildMockMasteryPath(easy, medium, hard, tags) {
  const total = easy + medium + hard;

  // ── Determine level ────────────────────────────────────────────────────
  let level = "beginner";
  if (total >= 300 || hard >= 50) level = "advanced";
  else if (total >= 75 || medium >= 30 || hard >= 5) level = "intermediate";

  // ── Identify weak areas from stats ────────────────────────────────────
  const hardRatio = total > 0 ? hard / total : 0;
  const medRatio  = total > 0 ? medium / total : 0;

  // ── Identify recent strengths from tags (what user is already doing) ──
  const recentTags = new Set(Array.isArray(tags) ? tags.map(t => t.toLowerCase()) : []);

  const hasDP      = recentTags.has("dynamic programming");
  const hasGraph   = recentTags.has("graph") || recentTags.has("dfs") || recentTags.has("bfs");
  const hasTree    = recentTags.has("tree") || recentTags.has("binary tree");
  const hasString  = recentTags.has("string") || recentTags.has("sliding window");
  const hasArray   = recentTags.has("array") || recentTags.has("two pointers");
  const hasBit     = recentTags.has("bit manipulation");
  const hasGreedy  = recentTags.has("greedy");
  const hasHeap    = recentTags.has("heap");

  // ── Build a step pool based on level + weak/strong areas ──────────────

  // All possible steps, tagged by their category
  const ALL_STEPS = {
    // Beginner topics
    "arrays-basics": {
      title: "Arrays & Two Pointers",
      description: `You've solved ${easy} easy problems — now drill two-pointer patterns on arrays to cut your medium solve time.`,
      topics: ["Two Pointers", "Prefix Sum", "Sliding Window"],
      weight: hasArray ? 0 : 3, // deprioritize if already doing it
    },
    "string-basics": {
      title: "String Manipulation & Pattern Matching",
      description: "Build fluency with string operations: reversal, anagram checks, and substring problems.",
      topics: ["String", "Hash Table", "Sliding Window"],
      weight: hasString ? 1 : 3,
    },
    "hashmap": {
      title: "Hash Maps & Frequency Counting",
      description: "Master O(1) lookup patterns — the backbone of most medium-difficulty problems.",
      topics: ["Hash Map", "Hash Set", "Counting"],
      weight: 2,
    },
    "linked-list": {
      title: "Linked List Patterns",
      description: "Slow/fast pointers, reversal, and cycle detection — essential pointer manipulation.",
      topics: ["Linked List", "Two Pointers", "Recursion"],
      weight: level === "beginner" ? 3 : 1,
    },
    "binary-search": {
      title: "Binary Search & Search Space Reduction",
      description: "Go beyond sorted-array lookup — apply binary search to answer-space problems.",
      topics: ["Binary Search", "Sorted Array", "Search Space"],
      weight: level === "beginner" ? 2 : 1,
    },

    // Intermediate topics
    "tree-dfs": {
      title: "Tree Traversal & DFS Patterns",
      description: hasTree
        ? `You've been working on trees — deepen this with path problems, LCA, and serialize/deserialize.`
        : "Master recursive tree thinking: inorder/preorder/postorder, path sums, and level-order.",
      topics: ["Binary Tree", "DFS", "Recursion", "BFS"],
      weight: hasTree ? 2 : 3,
    },
    "graph-bfs": {
      title: "Graph BFS & Shortest Paths",
      description: hasGraph
        ? `Since you've been doing graph problems, push into weighted shortest paths and multi-source BFS.`
        : "Build your graph intuition with BFS, connected components, and grid traversal.",
      topics: ["Graph", "BFS", "Matrix", "Topological Sort"],
      weight: hasGraph ? 1 : 3,
    },
    "dp-1d": {
      title: "1D Dynamic Programming",
      description: hasDP
        ? `You're already working on DP — shift from memoization to bottom-up tabulation for speed.`
        : "Learn to identify DP problems and build the recurrence from scratch.",
      topics: ["Dynamic Programming", "Memoization", "Tabulation"],
      weight: hasDP ? 1 : 3,
    },
    "backtracking": {
      title: "Backtracking & Combinatorics",
      description: `With ${medium} medium problems solved, combinatorial search (permutations, subsets, N-Queens) is the next skill gap.`,
      topics: ["Backtracking", "Recursion", "Permutations", "Subsets"],
      weight: level !== "beginner" ? 2 : 0,
    },
    "heap-greedy": {
      title: "Heaps, Priority Queues & Greedy",
      description: hasHeap || hasGreedy
        ? "Sharpen your greedy instincts — interval scheduling, task scheduling, and K-th element problems."
        : "Learn when greedy works and when it doesn't — build intuition with heap-based top-K problems.",
      topics: ["Heap", "Priority Queue", "Greedy", "Top K"],
      weight: level !== "beginner" ? 2 : 0,
    },

    // Advanced topics
    "dp-2d": {
      title: "2D & Interval Dynamic Programming",
      description: `${hard} hard problems down — grid DP (unique paths, edit distance) and interval DP (burst balloons) are the next frontier.`,
      topics: ["2D DP", "Grid DP", "Interval DP", "LCS/LIS"],
      weight: level === "advanced" ? 3 : (level === "intermediate" ? 1 : 0),
    },
    "graph-advanced": {
      title: "Advanced Graph: Dijkstra, Union-Find & Topological Sort",
      description: hasGraph
        ? "You know basic graph traversal — now tackle weighted shortest paths, cycle detection, and MST."
        : "Level up from BFS/DFS to Dijkstra, Bellman-Ford, and Union-Find.",
      topics: ["Dijkstra", "Union Find", "Bellman-Ford", "MST"],
      weight: level === "advanced" ? 3 : 0,
    },
    "bit-manipulation": {
      title: "Bit Manipulation & Math",
      description: hasBit
        ? "You've touched bit tricks — now systematically cover XOR patterns, bitmask DP, and modular arithmetic."
        : "Unlock a hidden speedup: bitwise operations cut many O(n) solutions to O(1).",
      topics: ["Bit Manipulation", "Math", "Modular Arithmetic"],
      weight: level === "advanced" ? 2 : (hasBit ? 1 : 0),
    },
    "segment-tree": {
      title: "Segment Trees & Fenwick Trees",
      description: "Range query/update problems are contest staples — build and query segment trees confidently.",
      topics: ["Segment Tree", "Fenwick Tree", "Range Query"],
      weight: level === "advanced" && hardRatio > 0.15 ? 2 : 0,
    },
    "trie-string-advanced": {
      title: "Tries & Advanced String Algorithms",
      description: "Word search, autocomplete, and pattern matching at scale — KMP, Z-algorithm, and Trie.",
      topics: ["Trie", "KMP", "String Matching", "Prefix Tree"],
      weight: level === "advanced" ? 2 : 0,
    },
  };

  // ── Pick the 5 most relevant steps by weight, break ties by category order ──
  const candidates = Object.entries(ALL_STEPS)
    .filter(([, s]) => s.weight > 0)
    .sort((a, b) => b[1].weight - a[1].weight);

  // Take top 5, guarantee we always have exactly 5
  const top5 = candidates.slice(0, 5);
  while (top5.length < 5) {
    // Fill with generic steps if somehow fewer than 5 pass the weight filter
    top5.push(["fallback-" + top5.length, {
      title: "Problem-Solving Patterns Review",
      description: "Review your weakest patterns with focused practice sets.",
      topics: ["Mixed", "Problem Solving"],
    }]);
  }

  // Assign day numbers: 1, 7, 13, 19, 25 (evenly spaced across 30 days)
  const DAY_SLOTS = [1, 7, 13, 19, 25];
  const steps = top5.map(([, step], i) => ({
    day: DAY_SLOTS[i],
    title: step.title,
    description: step.description,
    topics: step.topics,
  }));

  // ── Build title & description personalized to this user ───────────────
  const recentTagList = tags.length > 0
    ? tags.slice(0, 3).join(", ")
    : "general algorithms";

  const titles = {
    beginner: `Foundation Builder — ${easy + medium + hard} Problems Solved`,
    intermediate: `Pattern Mastery — Level Up from ${medium} Mediums`,
    advanced: `Elite Ascent — ${hard} Hards & Contest Prep`,
  };

  const descriptions = {
    beginner: `You've solved ${easy} easy, ${medium} medium, and ${hard} hard problems. This plan focuses on closing your foundational gaps to unlock consistent medium-problem solves.`,
    intermediate: `With ${medium} mediums solved and recent work in ${recentTagList}, this plan bridges you toward hard problems by drilling your weakest patterns.`,
    advanced: `${hard} hard problems done. This plan targets contest-level mastery — ${recentTagList} and beyond — to push your contest rating higher.`,
  };

  return {
    title: titles[level],
    description: descriptions[level],
    level,
    steps,
  };
}

module.exports = generateMasteryPath;
