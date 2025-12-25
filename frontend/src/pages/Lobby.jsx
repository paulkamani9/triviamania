import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Copy,
  Check,
  Crown,
  Send,
  Play,
  ChevronDown,
  Users,
} from "lucide-react";
import { useUserStore } from "../store/userStore";
import { useGameStore } from "../store/gameStore";
import { CATEGORIES, DIFFICULTIES, ROOM_STATUS } from "../constants";
import PageTransition from "../components/PageTransition";
import Button from "../components/Button";
import Input from "../components/Input";

export default function Lobby() {
  const navigate = useNavigate();
  const { userId, username } = useUserStore();
  const {
    roomCode,
    leaderId,
    players,
    status,
    messages,
    startGame,
    sendMessage,
    leaveRoom,
  } = useGameStore();

  const [category, setCategory] = useState(null);
  const [difficulty, setDifficulty] = useState(null);
  const [chatMessage, setChatMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const chatEndRef = useRef(null);
  const prevMessageCountRef = useRef(0);

  const isLeader = userId === leaderId;

  // Calculate connected players count
  const connectedPlayers = players.filter((p) => p.connected);
  const connectedCount = connectedPlayers.length;

  // Redirect if no room
  useEffect(() => {
    if (!roomCode) {
      navigate("/multiplayer");
    }
  }, [roomCode, navigate]);

  // Navigate to game when status changes
  useEffect(() => {
    if (status === ROOM_STATUS.COUNTDOWN || status === ROOM_STATUS.PLAYING) {
      navigate("/multiplayer/game");
    }
  }, [status, navigate]);

  // Scroll chat to bottom only when new messages arrive (not on initial load)
  useEffect(() => {
    if (messages.length > prevMessageCountRef.current) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevMessageCountRef.current = messages.length;
  }, [messages]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (chatMessage.trim()) {
      sendMessage(roomCode, userId, username, chatMessage.trim());
      setChatMessage("");
    }
  };

  const handleStartGame = () => {
    startGame(roomCode, category, difficulty);
  };

  const handleLeave = () => {
    leaveRoom(roomCode, userId);
    navigate("/multiplayer");
  };

  if (!roomCode) return null;

  return (
    <PageTransition>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={handleLeave}>
            <ArrowLeft className="w-5 h-5" />
          </Button>

          {/* Room Code */}
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-2 px-4 py-2 bg-dark-800 rounded-xl border border-dark-600 hover:bg-dark-700 transition-colors"
          >
            <span className="font-mono text-xl font-bold tracking-widest text-primary-400">
              {roomCode}
            </span>
            {copied ? (
              <Check className="w-5 h-5 text-accent-400" />
            ) : (
              <Copy className="w-5 h-5 text-dark-400" />
            )}
          </button>

          <div className="flex items-center gap-1 text-dark-400">
            <Users className="w-5 h-5" />
            <span className="font-semibold">{players.length}/8</span>
          </div>
        </div>

        {/* Share Instructions */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-sm text-dark-400 -mt-2"
        >
          Share this code with your friends to play together!
        </motion.p>

        {/* Players List */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="card"
        >
          <h3 className="text-sm text-dark-400 mb-3">Players</h3>
          <div className="space-y-2">
            <AnimatePresence>
              {players.map((player) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className={`flex items-center justify-between p-3 rounded-lg
                    ${
                      player.id === userId
                        ? "bg-primary-600/20 border border-primary-600/50"
                        : "bg-dark-800"
                    }
                    ${!player.connected ? "opacity-50" : ""}`}
                >
                  <div className="flex items-center gap-2">
                    {player.id === leaderId && (
                      <Crown className="w-4 h-4 text-yellow-400" />
                    )}
                    <span className="font-medium">
                      {player.username}
                      {player.id === userId && " (you)"}
                    </span>
                  </div>
                  {!player.connected && (
                    <span className="text-xs text-dark-400">Disconnected</span>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Game Config (Leader Only) */}
        {isLeader && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="card"
          >
            <h3 className="text-sm text-dark-400 mb-3">Game Settings</h3>

            {/* Category */}
            <div className="mb-3">
              <label className="text-xs text-dark-500 mb-1 block">
                Category
              </label>
              <div className="relative">
                <select
                  value={category || ""}
                  onChange={(e) =>
                    setCategory(
                      e.target.value ? parseInt(e.target.value) : null
                    )
                  }
                  className="input appearance-none pr-10 text-sm"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id ?? "any"} value={cat.id ?? ""}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400 pointer-events-none" />
              </div>
            </div>

            {/* Difficulty */}
            <div className="mb-4">
              <label className="text-xs text-dark-500 mb-1 block">
                Difficulty
              </label>
              <div className="grid grid-cols-4 gap-2">
                {DIFFICULTIES.map((diff) => (
                  <button
                    key={diff.id ?? "any"}
                    onClick={() => setDifficulty(diff.id)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all
                      ${
                        difficulty === diff.id
                          ? "bg-primary-600 text-white"
                          : "bg-dark-800 text-dark-300 hover:bg-dark-700"
                      }`}
                  >
                    {diff.name.replace("Any Difficulty", "Any")}
                  </button>
                ))}
              </div>
            </div>

            {/* Start Button */}
            <Button
              variant="accent"
              className="w-full"
              onClick={handleStartGame}
              disabled={connectedCount < 2}
            >
              <Play className="w-5 h-5 mr-2" />
              {connectedCount < 2
                ? `Need ${2 - connectedCount} More Connected`
                : "Start Game"}
            </Button>
          </motion.div>
        )}

        {/* Waiting message for non-leaders */}
        {!isLeader && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="card text-center"
          >
            <p className="text-dark-400">
              Waiting for the room leader to start the game...
            </p>
          </motion.div>
        )}

        {/* Chat */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <h3 className="text-sm text-dark-400 mb-3">Chat</h3>

          {/* Messages */}
          <div className="h-40 overflow-y-auto mb-3 space-y-2 scrollbar-thin">
            {messages.length === 0 ? (
              <p className="text-dark-500 text-sm text-center py-4">
                No messages yet
              </p>
            ) : (
              messages.map((msg, index) => (
                <div key={index} className="text-sm">
                  <span className="font-semibold text-primary-400">
                    {msg.username}:{" "}
                  </span>
                  <span className="text-dark-200">{msg.message}</span>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              placeholder="Type a message..."
              maxLength={200}
              className="flex-1"
            />
            <Button
              type="submit"
              variant="primary"
              disabled={!chatMessage.trim()}
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </motion.div>
      </div>
    </PageTransition>
  );
}
