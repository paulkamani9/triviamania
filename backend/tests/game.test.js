/**
 * Game Service Tests
 * Tests for room lifecycle, scoring, and reconnect handling
 */

import { jest } from "@jest/globals";

// Mock Redis
const mockRedisData = {};
const mockRedis = {
  hgetall: jest.fn((key) => Promise.resolve(mockRedisData[key] || {})),
  hset: jest.fn((key, data) => {
    mockRedisData[key] = { ...mockRedisData[key], ...data };
    return Promise.resolve();
  }),
  expire: jest.fn(() => Promise.resolve()),
  del: jest.fn((key) => {
    delete mockRedisData[key];
    return Promise.resolve();
  }),
  exists: jest.fn((key) => Promise.resolve(mockRedisData[key] ? 1 : 0)),
  pipeline: jest.fn(() => ({
    set: jest.fn().mockReturnThis(),
    del: jest.fn().mockReturnThis(),
    exec: jest.fn(() => Promise.resolve()),
  })),
};

jest.unstable_mockModule("../src/services/redis.js", () => ({
  getRedis: () => mockRedis,
  getRoom: async (roomCode) => {
    const data = mockRedisData[`room:${roomCode}`];
    if (!data || Object.keys(data).length === 0) return null;
    return {
      ...data,
      players: JSON.parse(data.players || "[]"),
      questions: JSON.parse(data.questions || "[]"),
      answers: JSON.parse(data.answers || "{}"),
      scores: JSON.parse(data.scores || "{}"),
      currentQuestion: parseInt(data.currentQuestion || "0", 10),
    };
  },
  saveRoom: async (roomCode, roomData) => {
    mockRedisData[`room:${roomCode}`] = {
      ...roomData,
      players: JSON.stringify(roomData.players),
      questions: JSON.stringify(roomData.questions),
      answers: JSON.stringify(roomData.answers),
      scores: JSON.stringify(roomData.scores),
      currentQuestion: String(roomData.currentQuestion),
    };
  },
  updateRoom: async (roomCode, fields) => {
    const key = `room:${roomCode}`;
    const serialized = {};
    for (const [k, v] of Object.entries(fields)) {
      if (["players", "questions", "answers", "scores"].includes(k)) {
        serialized[k] = JSON.stringify(v);
      } else if (k === "currentQuestion") {
        serialized[k] = String(v);
      } else {
        serialized[k] = v;
      }
    }
    mockRedisData[key] = { ...mockRedisData[key], ...serialized };
  },
  deleteRoom: async (roomCode) => {
    delete mockRedisData[`room:${roomCode}`];
  },
  roomExists: async (roomCode) => !!mockRedisData[`room:${roomCode}`],
  scheduleRoomCleanup: jest.fn(),
  cancelRoomCleanup: jest.fn(),
}));

// Mock trivia service
jest.unstable_mockModule("../src/services/trivia.js", () => ({
  fetchQuestions: jest.fn(() =>
    Promise.resolve([
      {
        question: "Test question 1?",
        type: "multiple",
        difficulty: "medium",
        category: "General",
        correctAnswer: "Correct",
        choices: ["Correct", "Wrong1", "Wrong2", "Wrong3"],
        correctIndex: 0,
      },
      {
        question: "Test question 2?",
        type: "multiple",
        difficulty: "medium",
        category: "General",
        correctAnswer: "Right",
        choices: ["Wrong", "Right", "Nope", "No"],
        correctIndex: 1,
      },
    ])
  ),
}));

// Mock supabase
jest.unstable_mockModule("../src/services/supabase.js", () => ({
  addUserPoints: jest.fn(() => Promise.resolve()),
  recordGameHistory: jest.fn(() => Promise.resolve()),
}));

// Import after mocking
const {
  generateRoomCode,
  createRoom,
  joinRoom,
  leaveRoom,
  disconnectPlayer,
  startGame,
  submitAnswer,
  getQuestionResults,
  ROOM_STATUS,
} = await import("../src/services/game.js");

describe("Room Code Generation", () => {
  test("generates 6-character codes", () => {
    const code = generateRoomCode();
    expect(code.length).toBe(6);
  });

  test("generates uppercase alphanumeric codes", () => {
    const code = generateRoomCode();
    expect(code).toMatch(/^[A-Z0-9]+$/);
  });

  test("excludes confusing characters", () => {
    // Generate many codes to verify no confusing chars
    for (let i = 0; i < 100; i++) {
      const code = generateRoomCode();
      expect(code).not.toMatch(/[OI01]/);
    }
  });
});

describe("Room Lifecycle", () => {
  beforeEach(() => {
    // Clear mock data before each test
    Object.keys(mockRedisData).forEach((key) => delete mockRedisData[key]);
  });

  test("creates room with leader", async () => {
    const room = await createRoom("user-123", "TestPlayer");

    expect(room.roomCode).toMatch(/^[A-Z0-9]{6}$/);
    expect(room.leaderId).toBe("user-123");
    expect(room.players).toHaveLength(1);
    expect(room.players[0].username).toBe("TestPlayer");
    expect(room.status).toBe(ROOM_STATUS.LOBBY);
  });

  test("allows player to join room", async () => {
    const created = await createRoom("leader-123", "Leader");
    const { room, reconnected } = await joinRoom(
      created.roomCode,
      "player-456",
      "Player2"
    );

    expect(reconnected).toBe(false);
    expect(room.players).toHaveLength(2);
    expect(room.scores["player-456"]).toBe(0);
  });

  test("prevents joining full room", async () => {
    const created = await createRoom("leader", "Leader");

    // Add 7 more players to fill the room (max 8)
    for (let i = 0; i < 7; i++) {
      await joinRoom(created.roomCode, `player-${i}`, `Player${i}`);
    }

    // 9th player should fail
    await expect(
      joinRoom(created.roomCode, "player-extra", "Extra")
    ).rejects.toThrow("Room is full");
  });

  test("handles player reconnection", async () => {
    const created = await createRoom("leader", "Leader");
    await joinRoom(created.roomCode, "player", "Player");

    // Simulate disconnect
    await disconnectPlayer(created.roomCode, "player");

    // Reconnect
    const { reconnected } = await joinRoom(
      created.roomCode,
      "player",
      "Player"
    );
    expect(reconnected).toBe(true);
  });

  test("promotes new leader when leader leaves", async () => {
    const created = await createRoom("leader", "Leader");
    await joinRoom(created.roomCode, "player2", "Player2");

    const { newLeaderId } = await leaveRoom(created.roomCode, "leader");
    expect(newLeaderId).toBe("player2");
  });
});

describe("Game Flow", () => {
  let roomCode;

  beforeEach(async () => {
    Object.keys(mockRedisData).forEach((key) => delete mockRedisData[key]);
    const room = await createRoom("leader", "Leader");
    roomCode = room.roomCode;
    await joinRoom(roomCode, "player2", "Player2");
  });

  test("starts game and fetches questions", async () => {
    const result = await startGame(roomCode, 9, "medium");

    expect(result.status).toBe(ROOM_STATUS.COUNTDOWN);
    expect(result.questions).toHaveLength(2);
    expect(result.questions[0].correctAnswer).toBe("Correct");
  });

  test("submits correct answer with score", async () => {
    await startGame(roomCode, 9, "medium");

    // Simulate game started
    const { getRoom, updateRoom } = await import("../src/services/redis.js");
    await updateRoom(roomCode, {
      status: ROOM_STATUS.PLAYING,
      questionStartedAt: Date.now(),
    });

    const result = await submitAnswer(roomCode, "leader", 0, "Correct");

    expect(result.correct).toBe(true);
    expect(result.score).toBeGreaterThan(0);
  });

  test("rejects answer for wrong question", async () => {
    await startGame(roomCode, 9, "medium");
    const { updateRoom } = await import("../src/services/redis.js");
    await updateRoom(roomCode, {
      status: ROOM_STATUS.PLAYING,
      questionStartedAt: Date.now(),
    });

    await expect(
      submitAnswer(roomCode, "leader", 5, "Correct") // Wrong question index
    ).rejects.toThrow("Wrong question index");
  });

  test("prevents duplicate answers", async () => {
    await startGame(roomCode, 9, "medium");
    const { updateRoom } = await import("../src/services/redis.js");
    await updateRoom(roomCode, {
      status: ROOM_STATUS.PLAYING,
      questionStartedAt: Date.now(),
    });

    await submitAnswer(roomCode, "leader", 0, "Correct");
    const duplicate = await submitAnswer(roomCode, "leader", 0, "Wrong1");

    expect(duplicate.alreadyAnswered).toBe(true);
    expect(duplicate.score).toBe(0);
  });

  test("calculates time-based scoring", async () => {
    await startGame(roomCode, 9, "medium");
    const { updateRoom } = await import("../src/services/redis.js");

    // Answer immediately (max bonus)
    await updateRoom(roomCode, {
      status: ROOM_STATUS.PLAYING,
      questionStartedAt: Date.now(),
    });
    const fastResult = await submitAnswer(roomCode, "leader", 0, "Correct");

    // Base 100 + time bonus should be close to max
    expect(fastResult.score).toBeGreaterThan(200);
  });
});

describe("Question Results", () => {
  test("returns correct answer and leaderboard", async () => {
    Object.keys(mockRedisData).forEach((key) => delete mockRedisData[key]);

    const room = await createRoom("leader", "Leader");
    await joinRoom(room.roomCode, "player2", "Player2");
    await startGame(room.roomCode, 9, "medium");

    const { updateRoom } = await import("../src/services/redis.js");
    await updateRoom(room.roomCode, {
      status: ROOM_STATUS.PLAYING,
      questionStartedAt: Date.now(),
    });

    await submitAnswer(room.roomCode, "leader", 0, "Correct");
    await submitAnswer(room.roomCode, "player2", 0, "Wrong1");

    const results = await getQuestionResults(room.roomCode, 0);

    expect(results.correctAnswer).toBe("Correct");
    expect(results.leaderboard).toHaveLength(2);
    expect(results.leaderboard[0].userId).toBe("leader"); // Leader should be first (correct)
  });
});

describe("Reconnect Grace Period", () => {
  beforeEach(() => {
    Object.keys(mockRedisData).forEach((key) => delete mockRedisData[key]);
  });

  test("allows reconnect within grace period", async () => {
    const room = await createRoom("leader", "Leader");
    await joinRoom(room.roomCode, "player", "Player");

    // Start game
    await startGame(room.roomCode, 9, "medium");
    const { updateRoom } = await import("../src/services/redis.js");
    await updateRoom(room.roomCode, { status: ROOM_STATUS.PLAYING });

    // Disconnect player
    await disconnectPlayer(room.roomCode, "player");

    // Reconnect immediately (within grace period)
    const { reconnected } = await joinRoom(room.roomCode, "player", "Player");
    expect(reconnected).toBe(true);
  });

  test("records disconnection time", async () => {
    const room = await createRoom("leader", "Leader");
    await disconnectPlayer(room.roomCode, "leader");

    const { getRoom } = await import("../src/services/redis.js");
    const updatedRoom = await getRoom(room.roomCode);

    expect(updatedRoom.players[0].connected).toBe(false);
    expect(updatedRoom.players[0].disconnectedAt).toBeDefined();
  });
});
