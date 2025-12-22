import { useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, X, RotateCcw, Home } from "lucide-react";
import { useSinglePlayerStore } from "../store/singlePlayerStore";
import { GAME_CONFIG } from "../constants";
import PageTransition from "../components/PageTransition";
import Button from "../components/Button";
import Timer from "../components/Timer";

export default function SinglePlayerGame() {
  const location = useLocation();
  const navigate = useNavigate();
  const { category, difficulty } = location.state || {};

  const {
    questions,
    currentIndex,
    score,
    timeRemaining,
    loading,
    error,
    selectedAnswer,
    showResult,
    gameOver,
    startGame,
    submitAnswer,
    reset,
  } = useSinglePlayerStore();

  useEffect(() => {
    startGame(category, difficulty);
    return () => reset();
  }, [category, difficulty, startGame, reset]);

  const currentQuestion = questions[currentIndex];

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
            onClick={() => startGame(category, difficulty)}
          >
            Try Again
          </Button>
        </div>
      </PageTransition>
    );
  }

  // Game over state
  if (gameOver) {
    const totalQuestions = questions.length;
    const correctCount = useSinglePlayerStore
      .getState()
      .answers.filter((a) => a.correct).length;
    const percentage = Math.round((correctCount / totalQuestions) * 100);

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
                  {totalQuestions - correctCount}
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
          </motion.div>

          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => navigate("/")}>
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
            <Button
              variant="primary"
              onClick={() => startGame(category, difficulty)}
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
          <div className="text-center">
            <p className="text-sm text-dark-400">Question</p>
            <p className="font-display font-bold">
              {currentIndex + 1} / {questions.length}
            </p>
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
              let stateClass = "";
              if (showResult) {
                if (choice === currentQuestion.correctAnswer) {
                  stateClass = "answer-correct";
                } else if (choice === selectedAnswer) {
                  stateClass = "answer-incorrect";
                }
              } else if (choice === selectedAnswer) {
                stateClass = "answer-selected";
              }

              return (
                <motion.button
                  key={choice}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => !showResult && submitAnswer(choice)}
                  disabled={showResult}
                  className={`w-full p-4 text-left rounded-xl border-2 border-dark-600 
                    bg-dark-800 hover:bg-dark-700 hover:border-dark-500
                    transition-all disabled:cursor-default
                    ${stateClass}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{choice}</span>
                    {showResult && choice === currentQuestion.correctAnswer && (
                      <Check className="w-5 h-5 text-accent-400" />
                    )}
                    {showResult &&
                      choice === selectedAnswer &&
                      choice !== currentQuestion.correctAnswer && (
                        <X className="w-5 h-5 text-red-400" />
                      )}
                  </div>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </PageTransition>
  );
}
