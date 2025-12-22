import { create } from "zustand";
import { GAME_CONFIG } from "../constants";

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

  // Results
  finalResults: null,

  // Timer
  timerInterval: null,

  // Initialize game via server
  startGame: async (category, difficulty, userId) => {
    set({ loading: true, error: null, gameOver: false, finalResults: null });

    try {
      const response = await fetch("/api/singleplayer/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, category, difficulty }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to start game");
      }

      const { sessionId, totalQuestions, currentQuestion, timeLimit } = data.data;

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
    set({ selectedAnswer: answer });

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

      const { correct, points, totalScore, correctAnswer, isGameOver, nextQuestion } = data.data;

      set({
        showResult: true,
        score: totalScore,
        correctAnswer,
      });

      // Auto-advance after delay
      setTimeout(() => {
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
      set({ error: error.message });
    }
  },

  // Time ran out
  timeUp: async () => {
    const { selectedAnswer, sessionId, currentIndex, questions } = get();
    if (selectedAnswer !== null) return;

    get().clearTimer();
    set({ selectedAnswer: null });

    try {
      const response = await fetch(`/api/singleplayer/${sessionId}/skip`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionIndex: currentIndex }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      const { correctAnswer, isGameOver, nextQuestion, totalScore } = data.data;

      set({
        showResult: true,
        correctAnswer,
        score: totalScore,
      });

      setTimeout(() => {
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
      set({ error: error.message });
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
    const interval = setInterval(() => {
      const time = get().timeRemaining;
      if (time <= 1) {
        get().timeUp();
      } else {
        set({ timeRemaining: time - 1 });
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
    });
  },
}));
