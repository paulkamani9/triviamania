import { create } from "zustand";
import { getSocket, connectSocket, disconnectSocket } from "../services/socket";
import { ROOM_STATUS, GAME_CONFIG } from "../constants";
import { playClickSound, playTickSound } from "../utils/sounds";

export const useGameStore = create((set, get) => ({
  // Connection state
  connected: false,
  connecting: false,

  // Room state
  roomCode: null,
  leaderId: null,
  players: [],
  status: null,
  category: null,
  difficulty: null,

  // Game state
  questions: [],
  currentQuestionIndex: 0,
  timeRemaining: GAME_CONFIG.QUESTION_TIME_LIMIT,
  countdown: 3,

  // Result state (for showing correct/wrong answers)
  showResult: false,
  correctAnswer: null,

  // Chat
  messages: [],

  // Error handling
  error: null,

  // Timer interval
  timerInterval: null,

  // Connect to socket and set up listeners
  connect: (userId, username) => {
    set({ connecting: true });
    const socket = connectSocket();

    socket.on("connect", () => {
      set({ connected: true, connecting: false });
      socket.emit("register", { userId, username });
    });

    socket.on("disconnect", () => {
      set({ connected: false });
    });

    // Room events
    socket.on("room-created", (data) => {
      set({
        roomCode: data.roomCode,
        leaderId: data.leaderId,
        players: data.players || [],
        status: ROOM_STATUS.LOBBY,
        error: null,
      });
    });

    socket.on("room-state", (data) => {
      set({
        roomCode: data.roomCode,
        leaderId: data.leaderId,
        players: data.players || [],
        status: data.status,
        category: data.category,
        difficulty: data.difficulty,
        scores: data.scores || {},
      });
    });

    socket.on("player-joined", (data) => {
      set({ players: data.players || [] });
    });

    socket.on("player-left", (data) => {
      set({
        players: data.players || [],
        leaderId: data.newLeaderId || get().leaderId,
      });
    });

    socket.on("player-disconnected", (data) => {
      const players = get().players.map((p) =>
        p.id === data.userId ? { ...p, connected: false } : p
      );
      set({ players });
    });

    socket.on("leader-promoted", (data) => {
      set({ leaderId: data.newLeaderId });
    });

    socket.on("room-closed", () => {
      get().resetRoom();
    });

    // Chat events
    socket.on("chat-message", (data) => {
      const messages = [...get().messages, data].slice(-100);
      set({ messages });
    });

    // Game flow events
    socket.on("game-starting", (data) => {
      set({
        status: ROOM_STATUS.COUNTDOWN,
        countdown: 3,
        category: data.category,
        difficulty: data.difficulty,
        questions: [],
        currentQuestionIndex: 0,
        messages: [],
        error: null,
      });
      // Countdown timer
      let count = 3;
      const countdownInterval = setInterval(() => {
        count--;
        set({ countdown: count });
        if (count <= 0) {
          clearInterval(countdownInterval);
        }
      }, 1000);
    });

    socket.on("question", (data) => {
      get().clearTimer();
      // Append question to questions array for reference
      const questions = [...get().questions];
      questions[data.index] = {
        question: data.question,
        type: data.type,
        category: data.category,
        difficulty: data.difficulty,
        answers: data.choices,
      };
      // Reset player answered states and result display
      const players = get().players.map((p) => ({ ...p, answered: false }));
      set({
        status: ROOM_STATUS.PLAYING,
        questions,
        currentQuestionIndex: data.index,
        timeRemaining: data.timeLimit,
        players,
        showResult: false,
        correctAnswer: null,
        lastAnswerCorrect: null,
      });
      get().startTimer();
    });

    socket.on("answer-received", (data) => {
      // Mark player as answered and update score
      const players = get().players.map((p) =>
        p.id === data.userId ? { ...p, answered: true, score: data.score } : p
      );
      set({ players });
    });

    socket.on("player-answered", (data) => {
      // Mark player as answered
      const players = get().players.map((p) =>
        p.id === data.userId ? { ...p, answered: true } : p
      );
      set({ players });
    });

    socket.on("question-results", (data) => {
      get().clearTimer();

      // Update player scores from leaderboard
      const players = get().players.map((p) => {
        const playerScore = data.leaderboard.find((l) => l.userId === p.id);
        return playerScore ? { ...p, score: playerScore.score } : p;
      });

      set({
        players,
        showResult: true,
        correctAnswer: data.correctAnswer,
        status: ROOM_STATUS.RESULTS,
      });
    });

    socket.on("game-over", (data) => {
      get().clearTimer();
      // Update final scores
      const players = get().players.map((p) => {
        const playerScore = data.finalScores.find((s) => s.id === p.id);
        return playerScore ? { ...p, score: playerScore.score } : p;
      });
      set({
        status: ROOM_STATUS.FINISHED,
        players,
      });
    });

    // Error handling
    socket.on("error", (data) => {
      set({ error: data.message });
    });

    return socket;
  },

  // Timer management - robust like singlePlayerStore
  startTimer: () => {
    // Clear any existing timer first
    get().clearTimer();

    const interval = setInterval(() => {
      const { timeRemaining, status, showResult } = get();

      // Stop timer if game is over or showing results
      if (status === ROOM_STATUS.FINISHED || showResult) {
        get().clearTimer();
        return;
      }

      if (timeRemaining <= 0) {
        get().clearTimer();
      } else {
        const newTime = timeRemaining - 1;

        // Play tick sound for last 5 seconds (like single-player)
        if (newTime <= GAME_CONFIG.TIMER_WARNING && newTime > 0) {
          playTickSound();
        }

        set({ timeRemaining: newTime });
      }
    }, 1000);
    set({ timerInterval: interval });
  },

  clearTimer: () => {
    const interval = get().timerInterval;
    if (interval) {
      clearInterval(interval);
      set({ timerInterval: null });
    }
  },

  // Room actions
  createRoom: (userId, username) => {
    const socket = getSocket();
    socket.emit("create-room", { userId, username });
  },

  joinRoom: (roomCode, userId, username) => {
    const socket = getSocket();
    socket.emit("join-room", {
      roomCode: roomCode.toUpperCase(),
      userId,
      username,
    });
  },

  leaveRoom: (roomCode, userId) => {
    const socket = getSocket();
    socket.emit("leave-room", { roomCode, userId });
    get().resetRoom();
  },

  // Game actions
  startGame: (roomCode, category, difficulty) => {
    const socket = getSocket();
    socket.emit("start-game", { roomCode, category, difficulty });
  },

  submitAnswer: (roomCode, userId, answer) => {
    const socket = getSocket();
    const questionIndex = get().currentQuestionIndex;
    playClickSound(); // Play click sound on answer selection
    socket.emit("submit-answer", { roomCode, userId, questionIndex, answer });
  },

  playAgain: (roomCode) => {
    // Clear any running timer first
    get().clearTimer();

    // Reset game state completely, return to lobby
    set({
      status: ROOM_STATUS.LOBBY,
      questions: [],
      currentQuestionIndex: 0,
      timeRemaining: GAME_CONFIG.QUESTION_TIME_LIMIT,
      showResult: false,
      correctAnswer: null,
      players: get().players.map((p) => ({ ...p, score: 0, answered: false })),
    });
  },

  // Chat
  sendMessage: (roomCode, userId, username, message) => {
    const socket = getSocket();
    socket.emit("chat-message", { roomCode, userId, username, message });
  },

  // Disconnect socket
  disconnect: () => {
    disconnectSocket();
    get().resetRoom();
    set({ connected: false });
  },

  // Reset
  resetRoom: () => {
    get().clearTimer();
    set({
      roomCode: null,
      leaderId: null,
      players: [],
      status: null,
      category: null,
      difficulty: null,
      questions: [],
      currentQuestionIndex: 0,
      timeRemaining: GAME_CONFIG.QUESTION_TIME_LIMIT,
      countdown: 3,
      messages: [],
      error: null,
      showResult: false,
      correctAnswer: null,
    });
  },

  clearError: () => set({ error: null }),
}));
