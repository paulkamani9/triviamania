import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Users, CheckCircle } from "lucide-react";
import { useUserStore } from "../store/userStore";
import { useGameStore } from "../store/gameStore";
import { ROOM_STATUS, GAME_CONFIG } from "../constants";
import PageTransition from "../components/PageTransition";
import Button from "../components/Button";
import Timer from "../components/Timer";

// Decode HTML entities
function decodeHTML(html) {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = html;
  return textarea.value;
}

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
    submitAnswer,
    playAgain,
    leaveRoom,
    disconnect,
  } = useGameStore();

  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [hasAnswered, setHasAnswered] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const isGameOver = status === ROOM_STATUS.FINISHED;
  const isPlaying = status === ROOM_STATUS.PLAYING;
  const isCountdown = status === ROOM_STATUS.COUNTDOWN;

  // Reset answer state on question change
  useEffect(() => {
    setSelectedAnswer(null);
    setHasAnswered(false);
  }, [currentQuestionIndex]);

  // Redirect if no room
  useEffect(() => {
    if (!roomCode) {
      navigate("/multiplayer");
    }
  }, [roomCode, navigate]);

  const handleSelectAnswer = (answer) => {
    if (hasAnswered || !isPlaying) return;

    setSelectedAnswer(answer);
    setHasAnswered(true);
    submitAnswer(roomCode, userId, answer);
  };

  const handlePlayAgain = () => {
    playAgain(roomCode);
  };

  const handleLeave = () => {
    leaveRoom(roomCode, userId);
    disconnect();
    navigate("/");
  };

  // Get sorted players by score
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  // Get current player
  const currentPlayer = players.find((p) => p.id === userId);
  const currentPlayerRank = sortedPlayers.findIndex((p) => p.id === userId) + 1;

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
                  <span className="text-2xl font-bold text-dark-300">2</span>
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
                  <span className="text-3xl font-bold">1</span>
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
                  <span className="text-2xl font-bold text-dark-400">3</span>
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
              {sortedPlayers.map((player, index) => (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-2 rounded-lg
                    ${
                      player.id === userId ? "bg-primary-600/20" : "bg-dark-800"
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 text-dark-400 text-sm">
                      #{index + 1}
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
          <div className="flex items-center gap-2">
            <span className="text-dark-400 text-sm">Question</span>
            <span className="font-semibold">
              {currentQuestionIndex + 1}/{questions.length}
            </span>
          </div>

          <Timer
            timeRemaining={timeRemaining}
            totalTime={GAME_CONFIG.QUESTION_TIME_LIMIT}
          />

          <div className="flex items-center gap-2 text-dark-400">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">
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
              {decodeHTML(currentQuestion.category)}
            </p>
            <h2 className="text-lg font-semibold leading-relaxed">
              {decodeHTML(currentQuestion.question)}
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
              const letter = String.fromCharCode(65 + index);

              return (
                <button
                  key={index}
                  onClick={() => handleSelectAnswer(answer)}
                  disabled={hasAnswered}
                  className={`w-full p-4 rounded-xl text-left transition-all flex items-center gap-3
                    ${
                      !hasAnswered
                        ? "bg-dark-800 hover:bg-dark-700 border border-dark-600 hover:border-primary-500"
                        : isSelected
                        ? "bg-primary-600/30 border border-primary-500"
                        : "bg-dark-800 border border-dark-700 opacity-50"
                    }
                  `}
                >
                  <span
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold
                    ${
                      isSelected
                        ? "bg-primary-600 text-white"
                        : "bg-dark-700 text-dark-400"
                    }`}
                  >
                    {letter}
                  </span>
                  <span className="flex-1">{decodeHTML(answer)}</span>
                  {isSelected && (
                    <CheckCircle className="w-5 h-5 text-primary-400" />
                  )}
                </button>
              );
            })}
          </motion.div>
        )}

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
