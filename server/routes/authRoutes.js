const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { registerUser, loginUser } = require('../controllers/authController');

router.post("/register", [
  body("name").trim().notEmpty().withMessage("Name required").isLength({ max: 100 }).withMessage("Name too long"),
  body("email").isEmail().withMessage("Invalid email format").normalizeEmail(),
  body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters long").matches(/^(?=.*[A-Za-z])(?=.*\d)/).withMessage("Password must contain letters and numbers"),
  body("passwordConfirm").notEmpty().withMessage("Password confirmation required"),
  body("leetcodeUsername").trim().notEmpty().withMessage("LeetCode username required").isLength({ max: 40 }).withMessage("LeetCode username too long")
], registerUser);

router.post("/login", [
  body("email").isEmail().withMessage("Invalid email format").normalizeEmail(),
  body("password").notEmpty().withMessage("Password required")
], loginUser);

module.exports = router;