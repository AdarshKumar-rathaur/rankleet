const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const { fetchLeetCodeStats, fetchAllUserData } = require("../services/leetcodeService");
const calculateScore = require("../utils/scoreCalculator");
const fetchRecentSubmissionTags = require("../services/leetcodeTagsService");
const generateMasteryPath = require("../services/masteryPathService");
const { getCookieOptions, getClearCookieOptions } = require("../utils/cookieOptions");

const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET not configured");
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// REGISTER
exports.registerUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const { name, email, password, passwordConfirm, leetcodeUsername } = req.body;

    // Validate password confirmation
    if (password !== passwordConfirm) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // Validate leetcodeUsername
    if (!leetcodeUsername || leetcodeUsername.trim().length === 0) {
      return res.status(400).json({ message: "LeetCode username is required" });
    }

    if (leetcodeUsername.length > 40) {
      return res.status(400).json({ message: "LeetCode username too long" });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      password: hashedPassword,
      leetcodeUsername: leetcodeUsername.trim(),
    });

    const token = generateToken(user._id);
    const cookieOptions = getCookieOptions(req);

    res.status(201)
      .cookie("token", token, cookieOptions)
      .json({
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || "",
      });

    // Fire-and-forget: fetch initial stats + calendar + mastery path for new user
    setImmediate(async () => {
      try {
        const { fetchAllUserData } = require("../services/leetcodeService");

        const { stats, avatar, contestRating, contestRanking, contestPercentile, submissionCalendar } =
          await fetchAllUserData(user.leetcodeUsername);

        const score = calculateScore(stats.easy, stats.medium, stats.hard);
        const tags = await fetchRecentSubmissionTags(user.leetcodeUsername);
        const masteryPath = await generateMasteryPath(stats, tags);

        const updateOp = {
          $set: {
            stats: { easy: stats.easy, medium: stats.medium, hard: stats.hard, total: stats.total, score },
            submissionCalendar,
            masteryPath,
            lastUpdated: new Date(),
          },
        };

        if (avatar) {
          updateOp.$set.avatar = avatar;
        }

        // Seed first contest history entry if user has a rating
        if (contestRating > 0) {
          updateOp.$set.contestRating = contestRating;
          updateOp.$push = {
            contestHistory: {
              rating: contestRating,
              date: new Date(),
              rank: contestRanking || 0,
              percentile: contestPercentile || 0,
            }
          };
        }

        await User.updateOne({ _id: user._id }, updateOp);
        console.log("[REGISTER] Initial data populated for:", user.leetcodeUsername);
      } catch (err) {
        console.error("[REGISTER] Initial setup failed:", err.message);
      }
    });
  } catch (error) {
    console.error("AUTH ERROR:", error.message);
    res.status(500).json({ message: "Registration failed" });
  }
};

// LOGIN
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (user && (await bcrypt.compare(password, user.password))) {
      const token = generateToken(user._id);
      const cookieOptions = getCookieOptions(req);

      res.cookie("token", token, cookieOptions).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || "",
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    console.error("LOGIN ERROR:", error.message);
    res.status(500).json({ message: "Login failed" });
  }
};

exports.logoutUser = async (req, res) => {
  try {
    res.clearCookie("token", getClearCookieOptions(req));
    return res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("LOGOUT ERROR:", error.message);
    return res.status(500).json({ message: "Logout failed" });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }
    const { _id, name, email, avatar } = req.user;
    return res.json({ _id, name, email, avatar: avatar || "" });
  } catch (error) {
    console.error("GET CURRENT USER ERROR:", error.message);
    res.status(500).json({ message: "Failed to fetch current user" });
  }
};
