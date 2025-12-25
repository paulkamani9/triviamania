import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Users, CheckCircle, Check, X, LogOut } from "lucide-react";
import { useUserStore } from "../store/userStore";
import { useGameStore } from "../store/gameStore";
import { ROOM_STATUS, GAME_CONFIG } from "../constants";
import PageTransition from "../components/PageTransition";
import Button from "../components/Button";
import Timer from "../components/Timer";
import {
  playCorrectSound,
  playWrongSound,
  playTimeoutSound,
} from "../utils/sounds";

export default function MultiplayerGame() {
  const navigate = useNavigate();
  const { userId, username } = useUserStore();
  const {
    roomCode,
    status,
    questions,
    currentQuestionIndex,
    players,
    timeRemaining,
    countdown,
    showResult,
    correctAnswer,
    submitAnswer,
    playAgain,
    leaveRoom,
    disconnect,
  } = useGameStore();

  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const soundPlayedRef = useRef(false);

  const currentQuestion = questions[currentQuestionIndex];
  const isGameOver = status === ROOM_STATUS.FINISHED;
  const isPlaying = status === ROOM_STATUS.PLAYING;
  const isResults = status === ROOM_STATUS.RESULTS;
  const isCountdown = status === ROOM_STATUS.COUNTDOWN;

  // Reset answer state on question change
  useEffect(() => {
    setSelectedAnswer(null);
    setHasAnswered(false);
    soundPlayedRef.current = false;
  }, [currentQuestionIndex]);

  // Play sound when results are shown
  useEffect(() => {
    if (showResult && correctAnswer && !soundPlayedRef.current) {
      soundPlayedRef.current = true;

      if (selectedAnswer === null) {
        // Didn't answer in time
        playTimeoutSound();
      } else if (selectedAnswer === correctAnswer) {
        // Answered correctly
        playCorrectSound();
      } else {
        // Answered incorrectly
        playWrongSound();
      }
    }
  }, [showResult, correctAnswer, selectedAnswer]);

  // Redirect if no room
  useEffect(() => {
    if (!roomCode) {
      navigate("/multiplayer");
    }
  }, [roomCode, navigate]);

  const handleSelectAnswer = (answer) => {
    if (hasAnswered || !isPlaying || showResult) return;

    setSelectedAnswer(answer);
    setHasAnswered(true);
    submitAnswer(roomCode, userId, answer);
  };

  const handlePlayAgain = () => {
    playAgain(roomCode);
    navigate(`/multiplayer/lobby`);
  };

  const handleLeave = () => {
    leaveRoom(roomCode, userId);
    disconnect();
    navigate("/");
  };

  // Get sorted players by score
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  // Calculate ranks with ties (same score = same rank, next rank skips)
  const getRanks = (players) => {
    const ranks = {};
    let currentRank = 1;

    players.forEach((player, index) => {
      if (index === 0) {
        ranks[player.id] = 1;
      } else if (player.score === players[index - 1].score) {
        // Same score as previous player, same rank
        ranks[player.id] = ranks[players[index - 1].id];
      } else {
        // Different score, rank = position + 1
        ranks[player.id] = index + 1;
      }
    });

    return ranks;
  };

  const playerRanks = getRanks(sortedPlayers);

  // Get current player
  const currentPlayer = players.find((p) => p.id === userId);
  const currentPlayerRank = playerRanks[userId] || 1;

  // Count answered players
  const answeredCount = players.filter((p) => p.answered).length;

  if (!roomCode) return null;

  // Countdown View
  if (isCountdown) {
    return (
      <PageTransition>
        <div className="min-h-[80vh] flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center"
          >
            <p className="text-dark-400 mb-4">Game starting in</p>
            <motion.span
              key={countdown}
              initial={{ scale: 1.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-8xl font-display font-bold text-primary-400"
            >
              {countdown}
            </motion.span>
          </motion.div>
        </div>
      </PageTransition>
    );
  }

  // Game Over View
  if (isGameOver) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-center"
          >
            <h1 className="text-3xl font-display font-bold mb-2">Game Over!</h1>
            <p className="text-dark-400">Final Results</p>
          </motion.div>

          {/* Podium */}
          <div className="flex justify-center items-end gap-4 h-48">
            {/* 2nd Place */}
            {sortedPlayers[1] && (
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col items-center"
              >
                <span className="text-sm text-dark-400 mb-2">
                  {sortedPlayers[1].username}
                </span>
                <div className="w-20 h-24 bg-dark-700 rounded-t-lg flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-dark-300">
                    {playerRanks[sortedPlayers[1].id]}
                  </span>
                  <span className="text-sm text-dark-400">
                    {sortedPlayers[1].score}
                  </span>
                </div>
              </motion.div>
            )}

            {/* 1st Place */}
            {sortedPlayers[0] && (
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col items-center"
              >
                <Trophy className="w-8 h-8 text-yellow-400 mb-2" />
                <span className="text-sm text-primary-400 font-semibold mb-2">
                  {sortedPlayers[0].username}
                </span>
                <div className="w-24 h-32 bg-primary-600 rounded-t-lg flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold">
                    {playerRanks[sortedPlayers[0].id]}
                  </span>
                  <span className="text-sm">{sortedPlayers[0].score}</span>
                </div>
              </motion.div>
            )}

            {/* 3rd Place */}
            {sortedPlayers[2] && (
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex flex-col items-center"
              >
                <span className="text-sm text-dark-400 mb-2">
                  {sortedPlayers[2].username}
                </span>
                <div className="w-20 h-20 bg-dark-800 rounded-t-lg flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-dark-400">
                    {playerRanks[sortedPlayers[2].id]}
                  </span>
                  <span className="text-sm text-dark-500">
                    {sortedPlayers[2].score}
                  </span>
                </div>
              </motion.div>
            )}
          </div>

          {/* Your Result */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="card text-center"
          >
            <p className="text-dark-400 text-sm">Your Rank</p>
            <p className="text-4xl font-bold text-primary-400">
              #{currentPlayerRank}
            </p>
            <p className="text-lg mt-1">{currentPlayer?.score || 0} points</p>
          </motion.div>

          {/* Full Leaderboard */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="card"
          >
            <h3 className="text-sm text-dark-400 mb-3">All Players</h3>
            <div className="space-y-2">
              {sortedPlayers.map((player) => (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-2 rounded-lg
                    ${
                      player.id === userId ? "bg-primary-600/20" : "bg-dark-800"
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 text-dark-400 text-sm">
                      #{playerRanks[player.id]}
                    </span>
                    <span
                      className={
                        player.id === userId
                          ? "text-primary-400 font-semibold"
                          : ""
                      }
                    >
                      {player.username}
                    </span>
                  </div>
                  <span className="font-mono font-semibold">
                    {player.score}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={handleLeave}
            >
              Exit
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={handlePlayAgain}
            >
              Play Again
            </Button>
          </div>
        </div>
      </PageTransition>
    );
  }

  // Playing View
  return (
    <PageTransition>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLeave}
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            <LogOut className="w-4 h-4 mr-1" />
            <span className="text-xs">Leave</span>
          </Button>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="text-dark-400 text-xs">Q</span>
              <span className="font-semibold text-sm">
                {currentQuestionIndex + 1}/{questions.length}
              </span>
            </div>
            <Timer
              timeRemaining={timeRemaining}
              totalTime={GAME_CONFIG.QUESTION_TIME_LIMIT}
            />
          </div>

          <div className="flex items-center gap-1 text-dark-400">
            <CheckCircle className="w-4 h-4" />
            <span className="text-xs">
              {answeredCount}/{players.length}
            </span>
          </div>
        </div>

        {/* Question */}
        {currentQuestion && (
          <motion.div
            key={currentQuestionIndex}
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="card"
          >
            <p className="text-xs text-dark-400 mb-2">
              {currentQuestion.category}
            </p>
            <h2 className="text-lg font-semibold leading-relaxed">
              {currentQuestion.question}
            </h2>
          </motion.div>
        )}

        {/* Answers */}
        {currentQuestion && (
          <motion.div
            key={`answers-${currentQuestionIndex}`}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="space-y-3"
          >
            {currentQuestion.answers.map((answer, index) => {
              const isSelected = selectedAnswer === answer;
              const isCorrect = showResult && answer === correctAnswer;
              const isWrong =
                showResult && isSelected && answer !== correctAnswer;
              const letter = String.fromCharCode(65 + index);

              // Determine button styling based on state
              let buttonClass = "bg-dark-800 border border-dark-600";
              let letterClass = "bg-dark-700 text-dark-400";

              if (showResult) {
                if (isCorrect) {
                  buttonClass =
                    "bg-accent-500/20 border-2 border-accent-400 answer-correct";
                  letterClass = "bg-accent-500 text-white";
                } else if (isWrong) {
                  buttonClass =
                    "bg-red-500/20 border-2 border-red-400 answer-incorrect";
                  letterClass = "bg-red-500 text-white";
                } else {
                  buttonClass = "bg-dark-800 border border-dark-700 opacity-50";
                }
              } else if (isSelected) {
                buttonClass = "bg-primary-600/30 border border-primary-500";
                letterClass = "bg-primary-600 text-white";
              } else if (!hasAnswered) {
                buttonClass =
                  "bg-dark-800 hover:bg-dark-700 border border-dark-600 hover:border-primary-500";
              }

              return (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: showResult && isCorrect ? [1, 1.02, 1] : 1,
                  }}
                  transition={{
                    delay: index * 0.05,
                    scale: { duration: 0.3, ease: "easeOut" },
                  }}
                  onClick={() => handleSelectAnswer(answer)}
                  disabled={hasAnswered || showResult}
                  className={`w-full p-4 rounded-xl text-left transition-all flex items-center gap-3 ${buttonClass}
                    ${
                      hasAnswered || showResult
                        ? "cursor-default"
                        : "cursor-pointer"
                    }`}
                >
                  <span
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold ${letterClass}`}
                  >
                    {letter}
                  </span>
                  <span className="flex-1">{answer}</span>

                  {/* Show checkmark for correct answer */}
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

                  {/* Show X for wrong selected answer */}
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

                  {/* Show checkmark when selected (before results) */}
                  {!showResult && isSelected && (
                    <CheckCircle className="w-5 h-5 text-primary-400" />
                  )}
                </motion.button>
              );
            })}
          </motion.div>
        )}

        {/* Floating Result Overlay - appears after everyone answers */}
        <AnimatePresence>
          {showResult && (
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
                  selectedAnswer === correctAnswer
                    ? "bg-accent-500/30 border-2 border-accent-400"
                    : selectedAnswer === null
                    ? "bg-yellow-500/30 border-2 border-yellow-400"
                    : "bg-red-500/30 border-2 border-red-400"
                }`}
              >
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
                  <p className="text-sm text-dark-300 mt-1">
                    Next question coming...
                  </p>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Live Scoreboard */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <div className="flex items-center gap-2 text-sm text-dark-400 mb-2">
            <Users className="w-4 h-4" />
            <span>Live Scores</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {sortedPlayers.slice(0, 4).map((player) => (
              <div
                key={player.id}
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm
                  ${
                    player.id === userId
                      ? "bg-primary-600/30 text-primary-400"
                      : "bg-dark-800 text-dark-300"
                  }
                  ${player.answered ? "ring-1 ring-accent-500" : ""}`}
              >
                <span className="truncate max-w-[80px]">{player.username}</span>
                <span className="font-mono font-semibold">{player.score}</span>
              </div>
            ))}
            {players.length > 4 && (
              <span className="text-dark-400 text-sm px-2">
                +{players.length - 4} more
              </span>
            )}
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
}
