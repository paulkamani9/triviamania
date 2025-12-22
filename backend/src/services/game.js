import { v4 as uuidv4 } from "uuid";
import { GAME_CONFIG } from "../config/index.js";
import {
  getRoom,
  saveRoom,
  updateRoom,
  deleteRoom,
  roomExists,
  scheduleRoomCleanup,
  cancelRoomCleanup,
} from "./redis.js";
import { fetchQuestions } from "./trivia.js";
import { addUserPoints, recordGameHistory } from "./supabase.js";

// ─────────────────────────────────────────────────────────────────────────────
// Room Status Constants
// ─────────────────────────────────────────────────────────────────────────────

export const ROOM_STATUS = {
  LOBBY: "lobby",
  COUNTDOWN: "countdown",
  PLAYING: "playing",
  RESULTS: "results",
  FINISHED: "finished",
};

// ─────────────────────────────────────────────────────────────────────────────
// Room Operations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate unique 6-character room code
 */
export function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Exclude confusing chars
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Create a new room
 */
export async function createRoom(leaderId, leaderUsername) {
  let roomCode = generateRoomCode();

  // Ensure unique code
  while (await roomExists(roomCode)) {
    roomCode = generateRoomCode();
  }

  const room = {
    roomCode,
    leaderId,
    players: [
      {
        id: leaderId,
        username: leaderUsername,
        connected: true,
        joinedAt: Date.now(),
      },
    ],
    category: null,
    difficulty: null,
    status: ROOM_STATUS.LOBBY,
    currentQuestion: 0,
    questions: [],
    answers: {},
    scores: { [leaderId]: 0 },
    createdAt: Date.now(),
    questionStartedAt: null,
  };

  await saveRoom(roomCode, room);
  return room;
}

/**
 * Join an existing room
 */
export async function joinRoom(roomCode, userId, username) {
  const room = await getRoom(roomCode);
  if (!room) {
    throw new Error("Room not found");
  }

  // Cancel any scheduled cleanup when someone joins
  cancelRoomCleanup(roomCode);

  if (room.status !== ROOM_STATUS.LOBBY) {
    // Check if reconnecting
    const existingPlayer = room.players.find((p) => p.id === userId);
    if (existingPlayer) {
      // Check reconnect grace period
      const disconnectedAt = existingPlayer.disconnectedAt || 0;
      const elapsed = (Date.now() - disconnectedAt) / 1000;

      if (
        elapsed <= GAME_CONFIG.RECONNECT_GRACE ||
        !existingPlayer.disconnectedAt
      ) {
        existingPlayer.connected = true;
        existingPlayer.disconnectedAt = null;
        await updateRoom(roomCode, { players: room.players });
        return { room, reconnected: true };
      } else {
        throw new Error("Reconnect grace period expired");
      }
    }
    throw new Error("Game already in progress");
  }

  if (room.players.length >= GAME_CONFIG.MAX_PLAYERS) {
    throw new Error("Room is full");
  }

  // Check if already in room
  const existingPlayer = room.players.find((p) => p.id === userId);
  if (existingPlayer) {
    existingPlayer.connected = true;
    existingPlayer.username = username;
    existingPlayer.disconnectedAt = null;
    await updateRoom(roomCode, { players: room.players });
    return { room, reconnected: true };
  }

  // Add new player
  room.players.push({
    id: userId,
    username,
    connected: true,
    joinedAt: Date.now(),
  });
  room.scores[userId] = 0;

  await updateRoom(roomCode, {
    players: room.players,
    scores: room.scores,
  });

  return { room, reconnected: false };
}

/**
 * Leave a room
 * @returns {{ room, newLeaderId, shouldDelete }} Updated state
 */
export async function leaveRoom(roomCode, userId) {
  const room = await getRoom(roomCode);
  if (!room) {
    return { room: null, newLeaderId: null, shouldDelete: true };
  }

  // Mark as disconnected
  const player = room.players.find((p) => p.id === userId);
  if (player) {
    player.connected = false;
  }

  // Check if all players disconnected
  const connectedPlayers = room.players.filter((p) => p.connected);

  if (connectedPlayers.length === 0) {
    // Schedule deletion after grace period (5 min)
    scheduleRoomCleanup(roomCode, GAME_CONFIG.EMPTY_ROOM_CLEANUP);
    await updateRoom(roomCode, { players: room.players });
    return {
      room,
      newLeaderId: null,
      shouldDelete: false,
      scheduledForCleanup: true,
    };
  }

  let newLeaderId = null;

  // If leader left, promote next connected player
  if (userId === room.leaderId) {
    const newLeader = connectedPlayers[0];
    room.leaderId = newLeader.id;
    newLeaderId = newLeader.id;
  }

  await updateRoom(roomCode, {
    players: room.players,
    leaderId: room.leaderId,
  });

  return { room, newLeaderId, shouldDelete: false };
}

/**
 * Mark player as disconnected (for reconnect grace period)
 */
export async function disconnectPlayer(roomCode, userId) {
  const room = await getRoom(roomCode);
  if (!room) return null;

  const player = room.players.find((p) => p.id === userId);
  if (player) {
    player.connected = false;
    player.disconnectedAt = Date.now();
    await updateRoom(roomCode, { players: room.players });
  }

  return room;
}

// ─────────────────────────────────────────────────────────────────────────────
// Game Operations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Start a game
 */
export async function startGame(roomCode, category, difficulty) {
  const room = await getRoom(roomCode);
  if (!room) {
    throw new Error("Room not found");
  }

  if (
    room.status !== ROOM_STATUS.LOBBY &&
    room.status !== ROOM_STATUS.FINISHED
  ) {
    throw new Error("Game already in progress");
  }

  // Fetch questions
  const questions = await fetchQuestions({
    amount: GAME_CONFIG.QUESTIONS_PER_GAME,
    category,
    difficulty,
  });

  // Reset game state
  const resetScores = {};
  const resetAnswers = {};
  room.players.forEach((p) => {
    resetScores[p.id] = 0;
    resetAnswers[p.id] = {};
  });

  await updateRoom(roomCode, {
    category: category || "Any",
    difficulty: difficulty || "Any",
    status: ROOM_STATUS.COUNTDOWN,
    currentQuestion: 0,
    questions,
    answers: resetAnswers,
    scores: resetScores,
    questionStartedAt: null,
  });

  return { ...room, questions, status: ROOM_STATUS.COUNTDOWN };
}

/**
 * Advance to next question or finish game
 */
export async function advanceQuestion(roomCode) {
  const room = await getRoom(roomCode);
  if (!room) return null;

  const nextIndex = room.currentQuestion + 1;

  if (nextIndex >= room.questions.length) {
    // Game over
    await updateRoom(roomCode, { status: ROOM_STATUS.FINISHED });
    return { room, finished: true };
  }

  await updateRoom(roomCode, {
    currentQuestion: nextIndex,
    status: ROOM_STATUS.PLAYING,
    questionStartedAt: Date.now(),
  });

  return { room: await getRoom(roomCode), finished: false };
}

/**
 * Start current question (set timer start)
 */
export async function startQuestion(roomCode) {
  await updateRoom(roomCode, {
    status: ROOM_STATUS.PLAYING,
    questionStartedAt: Date.now(),
  });
  return getRoom(roomCode);
}

/**
 * Submit answer
 * @returns {{ correct, score, alreadyAnswered, allAnswered }}
 */
export async function submitAnswer(roomCode, userId, questionIndex, answer) {
  const room = await getRoom(roomCode);
  if (!room) {
    throw new Error("Room not found");
  }

  if (room.status !== ROOM_STATUS.PLAYING) {
    throw new Error("Not accepting answers");
  }

  if (questionIndex !== room.currentQuestion) {
    throw new Error("Wrong question index");
  }

  // Check if already answered
  const userAnswers = room.answers[userId] || {};
  if (userAnswers[questionIndex] !== undefined) {
    return {
      correct: false,
      score: 0,
      alreadyAnswered: true,
      allAnswered: false,
    };
  }

  // Validate answer timing
  const now = Date.now();
  const elapsed = (now - room.questionStartedAt) / 1000;

  if (elapsed > GAME_CONFIG.QUESTION_TIME_LIMIT) {
    return {
      correct: false,
      score: 0,
      alreadyAnswered: false,
      allAnswered: false,
      tooLate: true,
    };
  }

  // Check correctness
  const question = room.questions[questionIndex];
  const correct = answer === question.correctAnswer;

  // Calculate score (faster = more points)
  let score = 0;
  if (correct) {
    const timeBonus = Math.max(0, GAME_CONFIG.QUESTION_TIME_LIMIT - elapsed);
    score = Math.round(100 + timeBonus * 10); // Base 100 + up to 150 bonus
  }

  // Update answers and scores
  userAnswers[questionIndex] = { answer, correct, score, answeredAt: now };
  room.answers[userId] = userAnswers;
  room.scores[userId] = (room.scores[userId] || 0) + score;

  // Check if all connected players answered
  const connectedPlayers = room.players.filter((p) => p.connected);
  const allAnswered = connectedPlayers.every(
    (p) => room.answers[p.id]?.[questionIndex] !== undefined
  );

  await updateRoom(roomCode, {
    answers: room.answers,
    scores: room.scores,
  });

  return { correct, score, alreadyAnswered: false, allAnswered };
}

/**
 * Get current question results
 */
export async function getQuestionResults(roomCode, questionIndex) {
  const room = await getRoom(roomCode);
  if (!room) return null;

  const question = room.questions[questionIndex];

  const results = room.players.map((p) => {
    const answer = room.answers[p.id]?.[questionIndex];
    return {
      userId: p.id,
      username: p.username,
      answered: !!answer,
      correct: answer?.correct || false,
      score: answer?.score || 0,
    };
  });

  // Sort leaderboard by score
  const leaderboard = Object.entries(room.scores)
    .map(([id, score]) => ({
      userId: id,
      username: room.players.find((p) => p.id === id)?.username || "Unknown",
      score,
    }))
    .sort((a, b) => b.score - a.score);

  return {
    correctAnswer: question.correctAnswer,
    results,
    leaderboard,
  };
}

/**
 * Finalize game and persist scores
 */
export async function finalizeGame(roomCode) {
  const room = await getRoom(roomCode);
  if (!room) return null;

  // Persist scores to Supabase for authenticated users
  const persistPromises = room.players.map(async (player) => {
    const score = room.scores[player.id] || 0;
    // Only persist if it looks like a real user ID (UUID format)
    if (player.id && player.id.includes("-") && score > 0) {
      await addUserPoints(player.id, score);
      await recordGameHistory({
        userId: player.id,
        gameType: "multiplayer",
        category: room.category,
        difficulty: room.difficulty,
        score,
        totalQuestions: room.questions.length,
      });
    }
  });

  await Promise.allSettled(persistPromises);

  // Get final standings
  const finalScores = Object.entries(room.scores)
    .map(([id, score]) => ({
      userId: id,
      username: room.players.find((p) => p.id === id)?.username || "Unknown",
      score,
    }))
    .sort((a, b) => b.score - a.score);

  const winner = finalScores[0] || null;

  return {
    finalScores,
    winner,
    stats: {
      totalQuestions: room.questions.length,
      category: room.category,
      difficulty: room.difficulty,
    },
  };
}

export default {
  ROOM_STATUS,
  generateRoomCode,
  createRoom,
  joinRoom,
  leaveRoom,
  disconnectPlayer,
  startGame,
  advanceQuestion,
  startQuestion,
  submitAnswer,
  getQuestionResults,
  finalizeGame,
};
