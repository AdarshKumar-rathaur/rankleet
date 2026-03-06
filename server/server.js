const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cron = require("node-cron");
const axios = require("axios");

const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");
const validateBody = require("./middleware/validateBody");
const refreshLeetCodeStats = require("./services/cronJobs");
const validateEnv = require("./utils/envValidator");

dotenv.config();

// Validate environment configuration
validateEnv();

connectDB();
refreshLeetCodeStats();

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  process.env.CLIENT_URL
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (!allowedOrigins.includes(origin)) {
        return callback(new Error("CORS not allowed"), false);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

app.use(helmet());
app.use(express.json({ limit: "10kb" }));
app.use(validateBody);

// Global rate limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests, please try again later",
  standardHeaders: false,
  legacyHeaders: false
});

// Stricter rate limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many login attempts, please try again later",
  standardHeaders: false,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === "development"
});

app.use(globalLimiter);

// Apply stricter rate limiting to auth routes
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/", (req, res) => {
  res.status(200).json({ message: "RankLeet API is running" });
});

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/groups", require("./routes/groupRoutes"));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Error handler middleware
app.use(errorHandler);

// Health check cron job - only if SERVER_URL is set
if (process.env.SERVER_URL) {
  cron.schedule("*/10 * * * *", async () => {
    try {
      await axios.get(`${process.env.SERVER_URL}/health`, { timeout: 5000 });
    } catch (err) {
      console.debug("Health check failed:", err.message);
    }
  });
}

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`[SERVER] Running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    console.log("HTTP server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT signal received: closing HTTP server");
  server.close(() => {
    console.log("HTTP server closed");
    process.exit(0);
  });
});