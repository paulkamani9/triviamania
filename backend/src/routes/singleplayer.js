import { Router } from "express";
import {
  startSession,
  getCurrentQuestion,
  submitAnswer,
  skipQuestion,
  endSession,
} from "../services/singleplayer.js";

const router = Router();

/**
 * POST /api/singleplayer/start
 * Start a new single player game session
 */
router.post("/start", async (req, res) => {
  try {
    const { userId, category, difficulty } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "userId is required",
      });
    }

    const session = await startSession(userId, category, difficulty);

    res.json({
      success: true,
      data: session,
    });
  } catch (error) {
    console.error("Start single player error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to start game",
    });
  }
});

/**
 * GET /api/singleplayer/:sessionId/question
 * Get current question for a session
 */
router.get("/:sessionId/question", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const questionData = await getCurrentQuestion(sessionId);

    res.json({
      success: true,
      data: questionData,
    });
  } catch (error) {
    console.error("Get question error:", error);
    res.status(error.message === "Session not found" ? 404 : 500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/singleplayer/:sessionId/answer
 * Submit an answer for the current question
 */
router.post("/:sessionId/answer", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { questionIndex, answer } = req.body;

    if (questionIndex === undefined || answer === undefined) {
      return res.status(400).json({
        success: false,
        error: "questionIndex and answer are required",
      });
    }

    const result = await submitAnswer(sessionId, questionIndex, answer);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Submit answer error:", error);
    res.status(error.message === "Session not found" ? 404 : 500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/singleplayer/:sessionId/skip
 * Skip current question (time ran out)
 */
router.post("/:sessionId/skip", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { questionIndex } = req.body;

    if (questionIndex === undefined) {
      return res.status(400).json({
        success: false,
        error: "questionIndex is required",
      });
    }

    const result = await skipQuestion(sessionId, questionIndex);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Skip question error:", error);
    res.status(error.message === "Session not found" ? 404 : 500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/singleplayer/:sessionId/end
 * End the game and get final results
 */
router.post("/:sessionId/end", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const result = await endSession(sessionId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("End session error:", error);
    res.status(error.message === "Session not found" ? 404 : 500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
