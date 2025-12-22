import { Router } from "express";
import {
  getLeaderboard,
  getUserRank,
  getUserById,
} from "../services/supabase.js";

const router = Router();

/**
 * GET /api/leaderboard
 * Get top 100 players by total points
 */
router.get("/", async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 100, 100);
    const leaderboard = await getLeaderboard(limit);

    res.json({
      success: true,
      data: leaderboard.map((user, index) => ({
        rank: index + 1,
        id: user.id,
        username: user.username,
        totalPoints: user.total_points,
      })),
    });
  } catch (error) {
    console.error("Leaderboard error:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch leaderboard" });
  }
});

/**
 * GET /api/leaderboard/user/:userId
 * Get specific user's rank and stats
 */
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const [user, rank] = await Promise.all([
      getUserById(userId),
      getUserRank(userId),
    ]);

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        totalPoints: user.total_points,
        rank,
      },
    });
  } catch (error) {
    console.error("User rank error:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch user rank" });
  }
});

export default router;
