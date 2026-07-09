const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cron = require("node-cron");
const axios = require("axios");
const cookieParser = require("cookie-parser");

const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");
const validateBody = require("./middleware/validateBody");
const refreshLeetCodeStats = require("./services/cronJobs");
const validateEnv = require("./utils/envValidator");

// API rate limiting: max 100 requests per 15 minutes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
});

dotenv.config();
validateEnv();
connectDB();
refreshLeetCodeStats(); 

const app = express();

app.set("trust proxy", 1);

// 1. Basic Middleware
const VERCEL_URL = process.env.VERCEL_URL || "https://rankleet.vercel.app";
const allowedOrigins = [process.env.CLIENT_URL, VERCEL_URL].filter(Boolean);
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    try {
      const parsedOrigin = new URL(origin);
      const isLocalDevHost =
        (parsedOrigin.hostname === "localhost" || parsedOrigin.hostname === "127.0.0.1") &&
        ["http:", "https:"].includes(parsedOrigin.protocol);

      if (isLocalDevHost || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
    } catch {
      // Fall through to the explicit allowlist check below.
    }

    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error("CORS not allowed"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept"],
}));

app.use(cookieParser());

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));
app.use(express.json({ limit: "10kb" }));
app.use(validateBody);

// 2. Health Check
app.get(["/health", "/api/health"], (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// 3. API Routes with rate limiting
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", apiLimiter, require("./routes/userRoutes"));
app.use("/api/groups", apiLimiter, require("./routes/groupRoutes"));
app.use("/api/bounties", apiLimiter, require("./routes/bountyRoutes"));
app.use("/api/ai-activity", apiLimiter, require("./routes/aiActivityRoutes"));

// 4. Global Error Handling
app.use(errorHandler);

// 5. Server Startup
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`
  🚀 RankLeet API is LIVE
  📡 Port: ${PORT}
  --------------------------------------------------
  `);

  const SERVER_URL = process.env.SERVER_URL || `http://localhost:${PORT}`;
  
  cron.schedule("*/10 * * * *", async () => {
    try {
      await axios.get(`${SERVER_URL}/health`);
      console.log("⚓ Self-ping successful: Server is awake.");
    } catch (err) {
      console.error("❌ Self-ping failed:", err.message);
    }
  });
});

// Graceful Shutdown
const shutdown = () => server.close(() => process.exit(0));
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);