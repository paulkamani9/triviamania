import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

import { config } from "./config/index.js";
import { initRedis } from "./services/redis.js";
import { initSupabase } from "./services/supabase.js";
import { setupSocketHandlers } from "./socket/index.js";
import healthRoutes from "./routes/health.js";
import leaderboardRoutes from "./routes/leaderboard.js";
import singleplayerRoutes from "./routes/singleplayer.js";

const app = express();
const httpServer = createServer(app);

// ─────────────────────────────────────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────────────────────────────────────

app.use(cors({ origin: config.clientOrigin, credentials: true }));
app.use(express.json());

// ─────────────────────────────────────────────────────────────────────────────
// REST Routes
// ─────────────────────────────────────────────────────────────────────────────

app.use("/health", healthRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/singleplayer", singleplayerRoutes);

// ─────────────────────────────────────────────────────────────────────────────
// Socket.io Setup
// ─────────────────────────────────────────────────────────────────────────────

const io = new Server(httpServer, {
  cors: {
    origin: config.clientOrigin,
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// ─────────────────────────────────────────────────────────────────────────────
// Initialize Services & Start Server
// ─────────────────────────────────────────────────────────────────────────────

async function start() {
  try {
    // Initialize Redis
    const redis = initRedis();
    await redis.connect();

    // Initialize Supabase
    initSupabase();

    // Setup Socket.io handlers
    setupSocketHandlers(io);

    // Start HTTP server
    httpServer.listen(config.port, () => {
      console.log(`🚀 Server running on port ${config.port}`);
      console.log(`   Environment: ${config.nodeEnv}`);
      console.log(`   Client origin: ${config.clientOrigin}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down...");
  httpServer.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

start();

export { io };
