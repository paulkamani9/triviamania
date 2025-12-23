import { useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Check,
  X,
  RotateCcw,
  Home,
  Trophy,
  Loader2,
  Pause,
  Play,
} from "lucide-react";
import { useSinglePlayerStore } from "../store/singlePlayerStore";
import { useUserStore } from "../store/userStore";
import { GAME_CONFIG } from "../constants";
import PageTransition from "../components/PageTransition";
import Button from "../components/Button";
import Timer from "../components/Timer";

export default function SinglePlayerGame() {
  const location = useLocation();
  const navigate = useNavigate();
  const { category, difficulty } = location.state || {};
  const { userId, username } = useUserStore();

  const {
    currentQuestion,
    currentIndex,
    totalQuestions,
    score,
    timeRemaining,
    loading,
    error,
    selectedAnswer,
    showResult,
    gameOver,
    correctAnswer,
    finalResults,
    validating,
    isPaused,
    startGame,
    submitAnswer,
    pauseGame,
    resumeGame,
    reset,
  } = useSinglePlayerStore();

  useEffect(() => {
    startGame(category, difficulty, userId, username);
    return () => reset();
  }, [category, difficulty, userId, username, startGame, reset]);

  // Loading state
  if (loading) {
    return (
      <PageTransition>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-dark-400">Loading questions...</p>
        </div>
      </PageTransition>
    );
  }

  // Error state
  if (error) {
    return (
      <PageTransition>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Button
            variant="primary"
            onClick={() => startGame(category, difficulty, userId, username)}
          >
            Try Again
          </Button>
        </div>
      </PageTransition>
    );
  }

  // Game over state
  if (gameOver) {
    const correctCount = finalResults?.correctCount || 0;
    const total = finalResults?.totalQuestions || totalQuestions || 20;
    const percentage =
      finalResults?.percentage || Math.round((correctCount / total) * 100);
    const leaderboardUpdated = finalResults?.leaderboardUpdated || false;

    // Star rating
    let stars = 0;
    if (percentage >= 80) stars = 3;
    else if (percentage >= 60) stars = 2;
    else if (percentage >= 40) stars = 1;

    return (
      <PageTransition>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="text-6xl mb-6"
          >
            {stars === 3
              ? "🏆"
              : stars === 2
              ? "🥈"
              : stars === 1
              ? "🥉"
              : "💪"}
          </motion.div>

          <h1 className="text-3xl font-display font-bold mb-2">Game Over!</h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card w-full max-w-sm mb-6"
          >
            <div className="text-center">
              <p className="text-dark-400 text-sm">Final Score</p>
              <p className="text-4xl font-display font-bold text-primary-400">
                {score}
              </p>
            </div>
            <div className="flex justify-around mt-4 pt-4 border-t border-dark-700">
              <div className="text-center">
                <p className="text-2xl font-bold text-accent-400">
                  {correctCount}
                </p>
                <p className="text-xs text-dark-400">Correct</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-400">
                  {total - correctCount}
                </p>
                <p className="text-xs text-dark-400">Wrong</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-dark-200">
                  {percentage}%
                </p>
                <p className="text-xs text-dark-400">Accuracy</p>
              </div>
            </div>
            {leaderboardUpdated && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-4 pt-4 border-t border-dark-700 flex items-center justify-center gap-2 text-accent-400"
              >
                <Trophy className="w-4 h-4" />
                <span className="text-sm">Score added to leaderboard!</span>
              </motion.div>
            )}
          </motion.div>

          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => navigate("/")}>
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
            <Button
              variant="primary"
              onClick={() => startGame(category, difficulty, userId, username)}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Play Again
            </Button>
          </div>
        </div>
      </PageTransition>
    );
  }

  // Question view
  if (!currentQuestion) return null;

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link to="/" onClick={() => reset()}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="text-center">
              <p className="text-sm text-dark-400">Question</p>
              <p className="font-display font-bold">
                {currentIndex + 1} / {totalQuestions}
              </p>
            </div>
            {/* Pause button - only show when not showing result or validating */}
            {!showResult && !validating && (
              <Button
                variant="ghost"
                size="sm"
                onClick={pauseGame}
                className="ml-2"
              >
                <Pause className="w-5 h-5" />
              </Button>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm text-dark-400">Score</p>
            <p className="font-display font-bold text-primary-400">{score}</p>
          </div>
        </div>

        {/* Timer */}
        <Timer seconds={timeRemaining} />

        {/* Question */}
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          className="card"
        >
          <p className="text-xs text-dark-400 mb-2">
            {currentQuestion.category} • {currentQuestion.difficulty}
          </p>
          <h2 className="text-xl font-semibold text-dark-50 leading-relaxed">
            {currentQuestion.question}
          </h2>
        </motion.div>

        {/* Answers */}
        <div className="space-y-3">
          <AnimatePresence mode="wait">
            {currentQuestion.choices.map((choice, index) => {
              const isSelected = choice === selectedAnswer;
              const isCorrect = choice === correctAnswer;
              const isWrong = isSelected && !isCorrect && showResult;

              // Determine button state classes
              let stateClass = "";
              if (showResult) {
                if (isCorrect) {
                  stateClass = "answer-correct";
                } else if (isWrong) {
                  stateClass = "answer-incorrect";
                }
              } else if (isSelected && validating) {
                stateClass = "answer-validating";
              }

              // Disabled when validating or showing result
              const isDisabled =
                validating || showResult || selectedAnswer !== null;

              return (
                <motion.button
                  key={choice}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: showResult && isCorrect ? [1, 1.02, 1] : 1,
                  }}
                  transition={{
                    delay: index * 0.1,
                    scale: { duration: 0.3, ease: "easeOut" },
                  }}
                  onClick={() => !isDisabled && submitAnswer(choice)}
                  disabled={isDisabled}
                  className={`w-full p-4 text-left rounded-xl border-2 
                    transition-all duration-200
                    ${isDisabled && !isSelected ? "opacity-60" : ""}
                    ${
                      validating && isSelected
                        ? "border-primary-500 bg-primary-500/10 animate-pulse"
                        : "border-dark-600 bg-dark-800"
                    }
                    ${
                      !isDisabled
                        ? "hover:bg-dark-700 hover:border-dark-500"
                        : ""
                    }
                    ${isDisabled ? "cursor-default" : "cursor-pointer"}
                    ${stateClass}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{choice}</span>

                    {/* Validating spinner */}
                    {validating && isSelected && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                      >
                        <Loader2 className="w-5 h-5 text-primary-400 animate-spin" />
                      </motion.div>
                    )}

                    {/* Correct answer checkmark */}
                    {showResult && isCorrect && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 15,
                        }}
                      >
                        <Check className="w-5 h-5 text-accent-400" />
                      </motion.div>
                    )}

                    {/* Wrong answer X */}
                    {showResult && isWrong && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{
                          opacity: 1,
                          scale: 1,
                          rotate: [0, -10, 10, 0],
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 15,
                        }}
                      >
                        <X className="w-5 h-5 text-red-400" />
                      </motion.div>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Floating Result Overlay - appears smoothly over content */}
        <AnimatePresence>
          {(validating || showResult) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
              style={{ top: "30%" }}
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: -20 }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 25,
                  duration: 0.3,
                }}
                className={`px-8 py-4 rounded-2xl shadow-2xl backdrop-blur-md ${
                  validating
                    ? "bg-dark-800/90 border border-primary-500/50"
                    : selectedAnswer === correctAnswer
                    ? "bg-accent-500/30 border-2 border-accent-400"
                    : selectedAnswer === null
                    ? "bg-yellow-500/30 border-2 border-yellow-400"
                    : "bg-red-500/30 border-2 border-red-400"
                }`}
              >
                {validating ? (
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-6 h-6 text-primary-400 animate-spin" />
                    <p className="text-primary-300 font-semibold text-lg">
                      Checking...
                    </p>
                  </div>
                ) : (
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.3 }}
                    className="text-center"
                  >
                    <p
                      className={`text-2xl font-bold ${
                        selectedAnswer === correctAnswer
                          ? "text-accent-300"
                          : selectedAnswer === null
                          ? "text-yellow-300"
                          : "text-red-300"
                      }`}
                    >
                      {selectedAnswer === correctAnswer
                        ? "🎉 Correct!"
                        : selectedAnswer === null
                        ? "⏰ Time's up!"
                        : "❌ Wrong!"}
                    </p>
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pause Modal Overlay */}
        <AnimatePresence>
          {isPaused && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-dark-900/80 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="card text-center max-w-sm mx-4"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
                  className="w-16 h-16 mx-auto mb-4 bg-primary-500/20 rounded-full flex items-center justify-center"
                >
                  <Pause className="w-8 h-8 text-primary-400" />
                </motion.div>

                <h2 className="text-2xl font-display font-bold mb-2">
                  Game Paused
                </h2>
                <p className="text-dark-400 mb-6">
                  Take your time. The timer is paused.
                </p>

                <div className="space-y-3">
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={resumeGame}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Resume Game
                  </Button>
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => {
                      reset();
                      navigate("/");
                    }}
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Quit to Home
                  </Button>
                </div>

                <div className="mt-6 pt-4 border-t border-dark-700">
                  <p className="text-xs text-dark-500">
                    Question {currentIndex + 1} of {totalQuestions} • Score:{" "}
                    {score}
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
