import { v4 as uuidv4 } from "uuid";
import { GAME_CONFIG } from "../config/index.js";
import { getRedis } from "./redis.js";
import { fetchQuestions } from "./trivia.js";
import { addUserPoints, recordGameHistory, ensureUserExists } from "./supabase.js";

// ─────────────────────────────────────────────────────────────────────────────
// Single Player Session Keys
// ─────────────────────────────────────────────────────────────────────────────

const SP_PREFIX = "sp:";
const SP_SESSION_TTL = 3600; // 1 hour

function sessionKey(sessionId) {
  return `${SP_PREFIX}${sessionId}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Scoring System (Difficulty-Based)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate score based on difficulty
 * @param {string} difficulty - 'easy', 'medium', or 'hard'
 * @param {boolean} correct - Whether the answer was correct
 * @returns {number} Points earned
 */
export function calculateScore(difficulty, correct) {
  if (!correct) return 0;

  switch (difficulty?.toLowerCase()) {
    case "easy":
      return 25;
    case "medium":
      return 50;
    case "hard":
      return 100;
    default:
      return 50; // Default to medium for 'any' or unknown
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Session Operations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Start a new single player game session
 * @param {string} userId - The user's ID
 * @param {string|null} username - The user's display name
 * @param {number|null} category - Category ID or null
 * @param {string|null} difficulty - Difficulty or null
 * @returns {Object} Session data with first question
 */
export async function startSession(userId, username = null, category = null, difficulty = null) {
  const r = getRedis();
  const sessionId = uuidv4();

  // Fetch questions from OpenTriviaDB
  const questions = await fetchQuestions({
    amount: GAME_CONFIG.QUESTIONS_PER_GAME,
    category,
    difficulty,
  });

  const session = {
    sessionId,
    userId,
    username: username || null,
    category: category || "Any",
    difficulty: difficulty || "Any",
    questions,
    currentIndex: 0,
    score: 0,
    answers: [],
    startedAt: Date.now(),
    questionStartedAt: Date.now(),
  };

  // Save to Redis
  await r.set(
    sessionKey(sessionId),
    JSON.stringify(session),
    "EX",
    SP_SESSION_TTL
  );

  // Return session info without correct answers exposed
  return {
    sessionId,
    totalQuestions: questions.length,
    category: session.category,
    difficulty: session.difficulty,
    currentQuestion: sanitizeQuestion(questions[0], 0),
    timeLimit: GAME_CONFIG.QUESTION_TIME_LIMIT,
  };
}

/**
 * Get current session state
 */
async function getSession(sessionId) {
  const r = getRedis();
  const data = await r.get(sessionKey(sessionId));
  if (!data) return null;
  return JSON.parse(data);
}

/**
 * Update session in Redis
 */
async function saveSession(session) {
  const r = getRedis();
  await r.set(
    sessionKey(session.sessionId),
    JSON.stringify(session),
    "EX",
    SP_SESSION_TTL
  );
}

/**
 * Get current question for a session (without answer)
 */
export async function getCurrentQuestion(sessionId) {
  const session = await getSession(sessionId);
  if (!session) {
    throw new Error("Session not found");
  }

  const { questions, currentIndex } = session;
  if (currentIndex >= questions.length) {
    throw new Error("Game already finished");
  }

  return {
    currentQuestion: sanitizeQuestion(questions[currentIndex], currentIndex),
    currentIndex,
    totalQuestions: questions.length,
    score: session.score,
    timeLimit: GAME_CONFIG.QUESTION_TIME_LIMIT,
  };
}

/**
 * Submit an answer for the current question
 */
export async function submitAnswer(sessionId, questionIndex, answer) {
  const session = await getSession(sessionId);
  if (!session) {
    throw new Error("Session not found");
  }

  const { questions, currentIndex, score, answers, questionStartedAt } =
    session;

  // Validate question index
  if (questionIndex !== currentIndex) {
    throw new Error("Wrong question index");
  }

  // Check if already answered
  if (answers[questionIndex] !== undefined) {
    return {
      alreadyAnswered: true,
      correct: false,
      score: 0,
      totalScore: score,
    };
  }

  // Check timing (optional - allow late answers with 0 points)
  const now = Date.now();
  const elapsed = (now - questionStartedAt) / 1000;
  const tooLate = elapsed > GAME_CONFIG.QUESTION_TIME_LIMIT;

  const question = questions[questionIndex];
  const correct = !tooLate && answer === question.correctAnswer;
  const points = calculateScore(question.difficulty, correct);

  // Record answer
  session.answers[questionIndex] = {
    answer,
    correct,
    points,
    tooLate,
    answeredAt: now,
  };
  session.score += points;

  // Move to next question
  session.currentIndex += 1;
  session.questionStartedAt = Date.now();

  await saveSession(session);

  const isGameOver = session.currentIndex >= questions.length;

  return {
    correct,
    points,
    totalScore: session.score,
    correctAnswer: question.correctAnswer,
    isGameOver,
    nextQuestion: isGameOver
      ? null
      : sanitizeQuestion(questions[session.currentIndex], session.currentIndex),
  };
}

/**
 * Skip current question (time ran out)
 */
export async function skipQuestion(sessionId, questionIndex) {
  const session = await getSession(sessionId);
  if (!session) {
    throw new Error("Session not found");
  }

  const { questions, currentIndex, answers } = session;

  if (questionIndex !== currentIndex) {
    throw new Error("Wrong question index");
  }

  // Check if already answered
  if (answers[questionIndex] !== undefined) {
    // Already handled, just return next question
    const isGameOver = session.currentIndex >= questions.length;
    return {
      correctAnswer: questions[questionIndex].correctAnswer,
      isGameOver,
      nextQuestion: isGameOver
        ? null
        : sanitizeQuestion(
            questions[session.currentIndex],
            session.currentIndex
          ),
      totalScore: session.score,
    };
  }

  // Record as skipped (0 points)
  session.answers[questionIndex] = {
    answer: null,
    correct: false,
    points: 0,
    skipped: true,
    answeredAt: Date.now(),
  };

  // Move to next question
  session.currentIndex += 1;
  session.questionStartedAt = Date.now();

  await saveSession(session);

  const isGameOver = session.currentIndex >= questions.length;

  return {
    correctAnswer: questions[questionIndex].correctAnswer,
    isGameOver,
    nextQuestion: isGameOver
      ? null
      : sanitizeQuestion(questions[session.currentIndex], session.currentIndex),
    totalScore: session.score,
  };
}

/**
 * End the game and persist score to leaderboard
 */
export async function endSession(sessionId) {
  const session = await getSession(sessionId);
  if (!session) {
    throw new Error("Session not found");
  }

  const { userId, username, score, questions, answers, category, difficulty } = session;

  // Calculate stats
  const correctCount = Object.values(answers).filter((a) => a.correct).length;
  const totalQuestions = questions.length;

  // Persist score to Supabase for authenticated users
  let leaderboardUpdated = false;
  if (userId && !userId.startsWith("anon_") && score > 0) {
    try {
      // Ensure user exists first with their username
      await ensureUserExists(userId, username);
      
      await addUserPoints(userId, score);
      await recordGameHistory({
        userId,
        gameType: "singleplayer",
        category,
        difficulty,
        score,
        totalQuestions,
      });
      leaderboardUpdated = true;
      console.log(`✅ Leaderboard updated for user ${userId}: +${score} points`);
    } catch (error) {
      console.error("Failed to persist single player score:", error.message);
    }
  } else {
    console.log(`ℹ️ Score not saved: userId=${userId}, isAnon=${userId?.startsWith("anon_")}, score=${score}`);
  }

  // Clean up session from Redis
  const r = getRedis();
  await r.del(sessionKey(sessionId));

  return {
    finalScore: score,
    correctCount,
    totalQuestions,
    percentage: Math.round((correctCount / totalQuestions) * 100),
    leaderboardUpdated,
  };
}

/**
 * Sanitize question for client (remove correct answer)
 */
function sanitizeQuestion(question, index) {
  return {
    index,
    question: question.question,
    type: question.type,
    difficulty: question.difficulty,
    category: question.category,
    choices: question.choices,
  };
}

export default {
  calculateScore,
  startSession,
  getCurrentQuestion,
  submitAnswer,
  skipQuestion,
  endSession,
};
