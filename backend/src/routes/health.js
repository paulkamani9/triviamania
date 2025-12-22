import { Router } from "express";
import { getRedis } from "../services/redis.js";

const router = Router();

/**
 * GET /health
 * Basic health check
 */
router.get("/", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

/**
 * GET /health/ready
 * Readiness check (includes Redis connectivity)
 */
router.get("/ready", async (req, res) => {
  try {
    const redis = getRedis();
    await redis.ping();
    res.json({ status: "ready", redis: "connected" });
  } catch (error) {
    res.status(503).json({ status: "not ready", error: error.message });
  }
});

export default router;
