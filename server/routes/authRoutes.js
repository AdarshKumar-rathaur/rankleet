const express = require('express');
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');
const { registerUser, loginUser, logoutUser, getCurrentUser } = require('../controllers/authController');
const protect = require('../middleware/authMiddleware');

const authLimiter = process.env.NODE_ENV === 'production'
  ? rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 20,
      message: 'Too many authentication attempts, please try again later',
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: true,
      handler: (req, res) => {
        res.setHeader('Retry-After', Math.ceil(15 * 60));
        return res.status(429).json({ message: 'Too many authentication attempts, please try again later' });
      },
    })
  : (req, res, next) => next();

const router = express.Router();

router.post(
  "/register",
  authLimiter,
  [
    body("name").trim().notEmpty().withMessage("Name required").isLength({ max: 100 }).withMessage("Name too long"),
    body("email").isEmail().withMessage("Invalid email format").normalizeEmail(),
    body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters long").matches(/^(?=.*[A-Za-z])(?=.*\d)/).withMessage("Password must contain letters and numbers"),
    body("passwordConfirm").notEmpty().withMessage("Password confirmation required"),
    body("leetcodeUsername").trim().notEmpty().withMessage("LeetCode username required").isLength({ max: 40 }).withMessage("LeetCode username too long"),
  ],
  registerUser
);

router.post(
  "/login",
  authLimiter,
  [
    body("email").isEmail().withMessage("Invalid email format").normalizeEmail(),
    body("password").notEmpty().withMessage("Password required"),
  ],
  loginUser
);

router.post("/logout", protect, logoutUser);
router.get("/me", protect, getCurrentUser);

module.exports = router;

