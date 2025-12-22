import { GAME_CONFIG } from "../config/index.js";
import {
  mapSocketToUser,
  removeSocketMappings,
  getUserIdFromSocket,
  getRoom,
  scheduleRoomCleanup,
  cancelRoomCleanup,
} from "../services/redis.js";
import {
  createRoom,
  joinRoom,
  leaveRoom,
  disconnectPlayer,
  startGame,
  startQuestion,
  advanceQuestion,
  submitAnswer,
  getQuestionResults,
  finalizeGame,
  ROOM_STATUS,
} from "../services/game.js";

// Active timers per room (in-memory for this instance)
const roomTimers = new Map();
// Reconnect grace period timers
const reconnectTimers = new Map();

/**
 * Setup all Socket.io event handlers
 */
export function setupSocketHandlers(io) {
  io.on("connection", (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // ─────────────────────────────────────────────────────────────────────────
    // Connection & Identity
    // ─────────────────────────────────────────────────────────────────────────

    socket.on("register", async ({ userId, username }) => {
      try {
        await mapSocketToUser(socket.id, userId);
        socket.userId = userId;
        socket.username = username;
        socket.emit("registered", { success: true });
      } catch (error) {
        emitError(socket, "Failed to register", "REGISTER_ERROR");
      }
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Room Management
    // ─────────────────────────────────────────────────────────────────────────

    socket.on("create-room", async ({ userId, username }) => {
      try {
        const room = await createRoom(userId, username);
        socket.join(room.roomCode);
        socket.roomCode = room.roomCode;
        await mapSocketToUser(socket.id, userId);
        socket.userId = userId;
        socket.username = username;

        socket.emit("room-created", {
          roomCode: room.roomCode,
          leaderId: room.leaderId,
          players: room.players,
        });
      } catch (error) {
        console.error("Create room error:", error);
        emitError(socket, error.message, "CREATE_ROOM_ERROR");
      }
    });

    socket.on("join-room", async ({ roomCode, userId, username }) => {
      try {
        const { room, reconnected } = await joinRoom(
          roomCode,
          userId,
          username
        );

        socket.join(roomCode);
        socket.roomCode = roomCode;
        await mapSocketToUser(socket.id, userId);
        socket.userId = userId;
        socket.username = username;

        // Cancel any pending reconnect timer for this user
        const reconnectKey = `${roomCode}:${userId}`;
        if (reconnectTimers.has(reconnectKey)) {
          clearTimeout(reconnectTimers.get(reconnectKey));
          reconnectTimers.delete(reconnectKey);
          console.log(`✅ Player ${username} reconnected within grace period`);
        }

        // Cancel room cleanup if it was scheduled
        cancelRoomCleanup(roomCode);

        // Notify all players
        io.to(roomCode).emit("player-joined", {
          roomCode,
          player: { id: userId, username, connected: true },
          players: room.players,
          reconnected,
        });

        // Send current room state to joining player
        socket.emit("room-state", {
          roomCode,
          leaderId: room.leaderId,
          players: room.players,
          status: room.status,
          category: room.category,
          difficulty: room.difficulty,
          currentQuestion: room.currentQuestion,
          scores: room.scores,
        });
      } catch (error) {
        console.error("Join room error:", error);
        emitError(socket, error.message, "JOIN_ROOM_ERROR");
      }
    });

    socket.on("leave-room", async ({ roomCode, userId }) => {
      try {
        const { room, newLeaderId, shouldDelete } = await leaveRoom(
          roomCode,
          userId
        );

        socket.leave(roomCode);
        socket.roomCode = null;

        if (shouldDelete) {
          io.to(roomCode).emit("room-closed", { roomCode });
          clearRoomTimers(roomCode);
        } else {
          io.to(roomCode).emit("player-left", {
            roomCode,
            userId,
            players: room.players,
            newLeaderId,
          });

          if (newLeaderId) {
            io.to(roomCode).emit("leader-promoted", {
              newLeaderId,
              username: room.players.find((p) => p.id === newLeaderId)
                ?.username,
            });
          }
        }
      } catch (error) {
        console.error("Leave room error:", error);
      }
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Chat
    // ─────────────────────────────────────────────────────────────────────────

    socket.on(
      "chat-message",
      async ({ roomCode, userId, username, message }) => {
        if (!message || message.length > 500) return;

        const sanitized = message.trim().slice(0, 500);
        io.to(roomCode).emit("chat-message", {
          username,
          message: sanitized,
          timestamp: Date.now(),
        });
      }
    );

    // ─────────────────────────────────────────────────────────────────────────
    // Game Flow
    // ─────────────────────────────────────────────────────────────────────────

    socket.on("start-game", async ({ roomCode, category, difficulty }) => {
      try {
        const room = await getRoom(roomCode);
        if (!room) {
          return emitError(socket, "Room not found", "ROOM_NOT_FOUND");
        }

        // Only leader can start
        if (socket.userId !== room.leaderId) {
          return emitError(
            socket,
            "Only the leader can start the game",
            "NOT_LEADER"
          );
        }

        const updatedRoom = await startGame(roomCode, category, difficulty);

        // Emit countdown
        io.to(roomCode).emit("game-starting", {
          countdown: 5,
          category: updatedRoom.category,
          difficulty: updatedRoom.difficulty,
          totalQuestions: updatedRoom.questions.length,
        });

        // Start first question after countdown
        setTimeout(() => {
          sendQuestion(io, roomCode, 0);
        }, 5000);
      } catch (error) {
        console.error("Start game error:", error);
        emitError(socket, error.message, "START_GAME_ERROR");
      }
    });

    socket.on(
      "submit-answer",
      async ({ roomCode, userId, questionIndex, answer }) => {
        try {
          const result = await submitAnswer(
            roomCode,
            userId,
            questionIndex,
            answer
          );

          // Acknowledge to submitter
          socket.emit("answer-received", {
            questionIndex,
            received: true,
            correct: result.correct,
            score: result.score,
          });

          // Notify room of answer count
          const room = await getRoom(roomCode);
          const connectedPlayers = room.players.filter((p) => p.connected);
          const answeredCount = connectedPlayers.filter(
            (p) => room.answers[p.id]?.[questionIndex] !== undefined
          ).length;

          io.to(roomCode).emit("player-answered", {
            userId,
            username: socket.username,
            answeredCount,
            totalPlayers: connectedPlayers.length,
          });

          // Auto-advance if all answered
          if (result.allAnswered && GAME_CONFIG.AUTO_ADVANCE_ON_ALL_ANSWERED) {
            clearRoomTimers(roomCode);
            await showResultsAndAdvance(io, roomCode, questionIndex);
          }
        } catch (error) {
          console.error("Submit answer error:", error);
          emitError(socket, error.message, "SUBMIT_ANSWER_ERROR");
        }
      }
    );

    // ─────────────────────────────────────────────────────────────────────────
    // Disconnect Handling
    // ─────────────────────────────────────────────────────────────────────────

    socket.on("disconnect", async () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);

      const userId = socket.userId || (await getUserIdFromSocket(socket.id));
      const roomCode = socket.roomCode;

      if (roomCode && userId) {
        const room = await disconnectPlayer(roomCode, userId);

        if (room) {
          io.to(roomCode).emit("player-disconnected", {
            userId,
            username: socket.username,
            gracePeriod: GAME_CONFIG.RECONNECT_GRACE,
          });

          // Check if all players disconnected
          const connectedPlayers = room.players.filter((p) => p.connected);
          if (connectedPlayers.length === 0) {
            // Schedule room cleanup
            scheduleRoomCleanup(roomCode, GAME_CONFIG.EMPTY_ROOM_CLEANUP);
          } else if (userId === room.leaderId) {
            // Leader disconnected, start grace period timer before promoting
            const reconnectKey = `${roomCode}:${userId}`;

            // Clear existing timer if any
            if (reconnectTimers.has(reconnectKey)) {
              clearTimeout(reconnectTimers.get(reconnectKey));
            }

            // Set timer to promote leader after grace period
            const timerId = setTimeout(async () => {
              const currentRoom = await getRoom(roomCode);
              if (currentRoom) {
                const player = currentRoom.players.find((p) => p.id === userId);
                // Only promote if player is still disconnected
                if (player && !player.connected) {
                  const connectedNow = currentRoom.players.filter(
                    (p) => p.connected
                  );
                  if (connectedNow.length > 0) {
                    const newLeader = connectedNow[0];
                    const { newLeaderId } = await leaveRoom(roomCode, userId);
                    if (newLeaderId) {
                      io.to(roomCode).emit("leader-promoted", {
                        newLeaderId,
                        username: newLeader.username,
                      });
                    }
                  }
                }
              }
              reconnectTimers.delete(reconnectKey);
            }, GAME_CONFIG.RECONNECT_GRACE * 1000);

            reconnectTimers.set(reconnectKey, timerId);
          }
        }
      }

      await removeSocketMappings(socket.id, userId);
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Emit error to client
 */
function emitError(socket, message, code) {
  socket.emit("error", { message, code });
}

/**
 * Send question to room
 */
async function sendQuestion(io, roomCode, questionIndex) {
  const room = await startQuestion(roomCode);
  if (!room || room.status === ROOM_STATUS.FINISHED) return;

  const question = room.questions[questionIndex];
  if (!question) return;

  // Send question without correct answer
  io.to(roomCode).emit("question", {
    index: questionIndex,
    question: question.question,
    type: question.type,
    category: question.category,
    difficulty: question.difficulty,
    choices: question.choices,
    timeLimit: GAME_CONFIG.QUESTION_TIME_LIMIT,
    timestamp: Date.now(),
    total: room.questions.length,
  });

  // Set timer for auto-advance
  const timerId = setTimeout(async () => {
    await showResultsAndAdvance(io, roomCode, questionIndex);
  }, GAME_CONFIG.QUESTION_TIME_LIMIT * 1000);

  setRoomTimer(roomCode, "question", timerId);
}

/**
 * Show results and advance to next question
 */
async function showResultsAndAdvance(io, roomCode, questionIndex) {
  const results = await getQuestionResults(roomCode, questionIndex);
  if (!results) return;

  // Emit results
  io.to(roomCode).emit("question-results", {
    index: questionIndex,
    correctAnswer: results.correctAnswer,
    results: results.results,
    leaderboard: results.leaderboard,
    nextIn: GAME_CONFIG.QUESTION_RESULTS_PAUSE,
  });

  // Advance after pause
  const timerId = setTimeout(async () => {
    const { room, finished } = await advanceQuestion(roomCode);

    if (finished) {
      const gameResults = await finalizeGame(roomCode);
      io.to(roomCode).emit("game-over", gameResults);
      clearRoomTimers(roomCode);
    } else if (room) {
      sendQuestion(io, roomCode, room.currentQuestion);
    }
  }, GAME_CONFIG.QUESTION_RESULTS_PAUSE * 1000);

  setRoomTimer(roomCode, "results", timerId);
}

/**
 * Set a timer for a room
 */
function setRoomTimer(roomCode, type, timerId) {
  if (!roomTimers.has(roomCode)) {
    roomTimers.set(roomCode, {});
  }
  const timers = roomTimers.get(roomCode);
  if (timers[type]) {
    clearTimeout(timers[type]);
  }
  timers[type] = timerId;
}

/**
 * Clear all timers for a room
 */
function clearRoomTimers(roomCode) {
  const timers = roomTimers.get(roomCode);
  if (timers) {
    Object.values(timers).forEach((t) => clearTimeout(t));
    roomTimers.delete(roomCode);
  }
}

export default { setupSocketHandlers };
