import { create } from "zustand";
import { GAME_CONFIG } from "../constants";
import {
  playCorrectSound,
  playWrongSound,
  playTimeoutSound,
  playClickSound,
} from "../utils/sounds";

// Single player game store (server-side validated)
export const useSinglePlayerStore = create((set, get) => ({
  // Session state
  sessionId: null,

  // Game state
  questions: [], // Store questions as they come (for reference)
  currentIndex: 0,
  totalQuestions: 0,
  score: 0,
  timeRemaining: GAME_CONFIG.QUESTION_TIME_LIMIT,

  // Config
  category: null,
  difficulty: null,

  // Current question
  currentQuestion: null,

  // UI state
  loading: false,
  error: null,
  selectedAnswer: null,
  showResult: false,
  gameOver: false,
  correctAnswer: null,
  validating: false, // True while waiting for server response
  isPaused: false, // Pause state for mid-game pause

  // Results
  finalResults: null,

  // Timer
  timerInterval: null,

  // Initialize game via server
  startGame: async (category, difficulty, userId, username) => {
    set({ loading: true, error: null, gameOver: false, finalResults: null });

    try {
      const response = await fetch("/api/singleplayer/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, username, category, difficulty }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to start game");
      }

      const { sessionId, totalQuestions, currentQuestion, timeLimit } =
        data.data;

      set({
        sessionId,
        totalQuestions,
        currentIndex: 0,
        currentQuestion,
        score: 0,
        category: data.data.category,
        difficulty: data.data.difficulty,
        loading: false,
        selectedAnswer: null,
        showResult: false,
        correctAnswer: null,
        timeRemaining: timeLimit,
        questions: [currentQuestion], // Track questions for reference
      });

      get().startTimer();
    } catch (error) {
      set({ loading: false, error: error.message });
    }
  },

  // Submit answer via server
  submitAnswer: async (answer) => {
    const { sessionId, currentIndex, selectedAnswer, questions } = get();
    if (selectedAnswer !== null) return; // Already answered

    get().clearTimer();
    playClickSound(); // Click feedback
    set({ selectedAnswer: answer, validating: true });

    try {
      const response = await fetch(`/api/singleplayer/${sessionId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionIndex: currentIndex, answer }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      const {
        correct,
        points,
        totalScore,
        correctAnswer,
        isGameOver,
        nextQuestion,
      } = data.data;

      // Play sound based on result
      if (correct) {
        playCorrectSound();
      } else {
        playWrongSound();
      }

      set({
        showResult: true,
        validating: false,
        score: totalScore,
        correctAnswer,
      });

      // Auto-advance after delay
      setTimeout(() => {
        // Check if session still exists (user might have left)
        const { sessionId: currentSessionId } = get();
        if (!currentSessionId) return;

        if (isGameOver) {
          get().endGame();
        } else {
          // Add next question to our list
          const updatedQuestions = [...questions, nextQuestion];
          set({
            currentIndex: currentIndex + 1,
            currentQuestion: nextQuestion,
            questions: updatedQuestions,
            selectedAnswer: null,
            showResult: false,
            correctAnswer: null,
            timeRemaining: GAME_CONFIG.QUESTION_TIME_LIMIT,
          });
          get().startTimer();
        }
      }, 2000);
    } catch (error) {
      console.error("Submit answer error:", error);
      set({ error: error.message, validating: false });
    }
  },

  // Time ran out
  timeUp: async () => {
    const {
      selectedAnswer,
      sessionId,
      currentIndex,
      questions,
      showResult,
      gameOver,
    } = get();

    // Don't skip if no session, already answered, showing result, or game over
    if (!sessionId || selectedAnswer !== null || showResult || gameOver) return;

    get().clearTimer();
    playTimeoutSound(); // Play timeout sound
    set({ validating: true });

    try {
      const response = await fetch(`/api/singleplayer/${sessionId}/skip`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionIndex: currentIndex }),
      });

      const data = await response.json();

      // Check again if session still exists after async call
      if (!get().sessionId) return;

      if (!data.success) {
        // If it's a "wrong question index" error, the question was likely already handled
        // Just try to get the current state and move on
        if (data.error?.includes("Wrong question index")) {
          console.warn("Question already handled, moving to next");
          // Force end game check or try to recover
          get().endGame();
          return;
        }
        throw new Error(data.error);
      }

      const { correctAnswer, isGameOver, nextQuestion, totalScore } = data.data;

      set({
        showResult: true,
        correctAnswer,
        score: totalScore,
        validating: false,
      });

      setTimeout(() => {
        // Check if session still exists (user might have left)
        const { sessionId: currentSessionId, gameOver: currentGameOver } =
          get();
        if (!currentSessionId || currentGameOver) return;

        if (isGameOver) {
          get().endGame();
        } else {
          const updatedQuestions = [...questions, nextQuestion];
          set({
            currentIndex: currentIndex + 1,
            currentQuestion: nextQuestion,
            questions: updatedQuestions,
            selectedAnswer: null,
            showResult: false,
            correctAnswer: null,
            timeRemaining: GAME_CONFIG.QUESTION_TIME_LIMIT,
          });
          get().startTimer();
        }
      }, 2000);
    } catch (error) {
      console.error("Skip question error:", error);
      // Only set error if session still exists
      if (get().sessionId) {
        set({ error: error.message, validating: false });
      }
    }
  },

  // End game and get final results
  endGame: async () => {
    const { sessionId } = get();
    get().clearTimer();

    try {
      const response = await fetch(`/api/singleplayer/${sessionId}/end`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      set({
        gameOver: true,
        showResult: false,
        finalResults: data.data,
        score: data.data.finalScore,
      });
    } catch (error) {
      console.error("End game error:", error);
      // Still mark as game over even on error
      set({
        gameOver: true,
        showResult: false,
        error: error.message,
      });
    }
  },

  // Timer
  startTimer: () => {
    // IMPORTANT: Clear any existing timer first to prevent multiple intervals
    get().clearTimer();

    const interval = setInterval(() => {
      const { timeRemaining, sessionId, gameOver, isPaused } = get();

      // Don't run if no session, game is over, or paused
      if (!sessionId || gameOver) {
        get().clearTimer();
        return;
      }

      // Skip countdown while paused
      if (isPaused) return;

      if (timeRemaining <= 1) {
        get().timeUp();
      } else {
        set({ timeRemaining: timeRemaining - 1 });
      }
    }, 1000);
    set({ timerInterval: interval });
  },

  // Pause/Resume for single-player
  pauseGame: () => {
    set({ isPaused: true });
  },

  resumeGame: () => {
    set({ isPaused: false });
  },

  clearTimer: () => {
    const interval = get().timerInterval;
    if (interval) {
      clearInterval(interval);
      set({ timerInterval: null });
    }
  },

  // Reset
  reset: () => {
    get().clearTimer();
    set({
      sessionId: null,
      questions: [],
      currentIndex: 0,
      totalQuestions: 0,
      score: 0,
      timeRemaining: GAME_CONFIG.QUESTION_TIME_LIMIT,
      category: null,
      difficulty: null,
      currentQuestion: null,
      loading: false,
      error: null,
      selectedAnswer: null,
      showResult: false,
      gameOver: false,
      correctAnswer: null,
      finalResults: null,
      validating: false,
      isPaused: false,
    });
  },
}));
