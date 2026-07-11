const express = require("express");
const http = require("http");
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cron = require("node-cron");
const axios = require("axios");
const cookieParser = require("cookie-parser");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const Message = require("./models/Message");

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
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  process.env.CLIENT_URL,
  VERCEL_URL,
].filter(Boolean);
const corsOptions = {
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
};
app.use(cors(corsOptions));

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
app.use("/api/arenas", require("./routes/arenaChatRoutes"));

// 4. Global Error Handling
app.use(errorHandler);

// 5. Server Startup
const PORT = Number(process.env.PORT || 5000);
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error("CORS not allowed"));
    },
    credentials: true,
    methods: ["GET", "POST"],
  },
});

const startServer = () => {
  const listen = (port) => {
    httpServer.removeAllListeners("error");
    httpServer.once("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(`❌ Port ${port} is already in use. Trying ${port + 1}...`);
        listen(port + 1);
      } else {
        console.error("❌ Server failed to start:", error);
        process.exit(1);
      }
    });

    httpServer.listen(port, () => {
      console.log(`
  🚀 RankLeet API is LIVE
  📡 Port: ${port}
  --------------------------------------------------
  `);

      const SERVER_URL = process.env.SERVER_URL || `http://localhost:${port}`;

      cron.schedule("*/10 * * * *", async () => {
        try {
          await axios.get(`${SERVER_URL}/health`);
          console.log("⚓ Self-ping successful: Server is awake.");
        } catch (err) {
          console.error("❌ Self-ping failed:", err.message);
        }
      });
    });
  };

  listen(PORT);
};

startServer();

const onlineUsers = new Map();
const arenaMembers = new Map();

io.on("connection", (socket) => {
  socket.on("authenticate", ({ userId }) => {
    if (!userId) return;
    onlineUsers.set(socket.id, userId);
    io.emit("presence:update", Array.from(new Set([...onlineUsers.values()])));
  });

  socket.on("join_arena", ({ arenaId, userId }) => {
    if (!arenaId || !userId) return;
    socket.data.activeArenaId = arenaId;
    socket.join(arenaId);
    if (!arenaMembers.has(arenaId)) arenaMembers.set(arenaId, new Set());
    arenaMembers.get(arenaId).add(userId);
    io.to(arenaId).emit("arena:presence", Array.from(arenaMembers.get(arenaId)));
  });

  socket.on("leave_arena", ({ arenaId, userId }) => {
    if (!arenaId || !userId) return;
    socket.data.activeArenaId = null;
    socket.leave(arenaId);
    const members = arenaMembers.get(arenaId);
    if (members) {
      members.delete(userId);
      if (members.size === 0) arenaMembers.delete(arenaId);
      else io.to(arenaId).emit("arena:presence", Array.from(members));
    }
  });

  socket.on("arena:send_message", async ({ arenaId, message }) => {
    if (!arenaId || !message?.text) return;

    try {
      const created = await Message.create({
        arenaId: new mongoose.Types.ObjectId(arenaId),
        senderId: message.senderId,
        text: message.text,
      });
      const populated = await created.populate("senderId", "name avatar leetcodeUsername");
      const payload = populated.toObject();

      io.to(arenaId).emit("arena:message", payload);

      const senderId = message.senderId?.toString?.() || message.senderId;
      for (const [socketId, userId] of onlineUsers.entries()) {
        const activeArenaId = io.sockets.sockets.get(socketId)?.data?.activeArenaId;
        const isInRoom = io.sockets.adapter.rooms.get(arenaId)?.has(socketId);
        if (userId?.toString?.() !== senderId && !isInRoom) {
          io.to(socketId).emit("arena:unread", { arenaId, message: payload });
        }
        if (activeArenaId && activeArenaId !== arenaId) {
          io.to(socketId).emit("arena:unread", { arenaId, message: payload });
        }
      }
    } catch (error) {
      console.error("Socket message save failed", error);
      socket.emit("arena:error", { message: "Failed to save message" });
    }
  });

  socket.on("disconnect", () => {
    const userId = onlineUsers.get(socket.id);
    onlineUsers.delete(socket.id);
    for (const [arenaId, members] of arenaMembers.entries()) {
      if (members.has(userId)) {
        members.delete(userId);
        if (members.size === 0) arenaMembers.delete(arenaId);
        else io.to(arenaId).emit("arena:presence", Array.from(members));
      }
    }
    io.emit("presence:update", Array.from(new Set([...onlineUsers.values()])));
  });
});

// Graceful Shutdown
const shutdown = () => httpServer.close(() => process.exit(0));
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);