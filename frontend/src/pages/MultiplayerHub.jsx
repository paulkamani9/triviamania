import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, LogIn, Copy, Check } from "lucide-react";
import { useUserStore } from "../store/userStore";
import { useGameStore } from "../store/gameStore";
import PageTransition from "../components/PageTransition";
import Button from "../components/Button";
import Input from "../components/Input";

export default function MultiplayerHub() {
  const navigate = useNavigate();
  const { userId, username } = useUserStore();
  const { connect, createRoom, joinRoom, roomCode, error, clearError } =
    useGameStore();

  const [joinCode, setJoinCode] = useState("");
  const [copied, setCopied] = useState(false);

  // Connect socket on mount
  useEffect(() => {
    connect(userId, username);
  }, [connect, userId, username]);

  // Navigate to lobby when room is created/joined
  useEffect(() => {
    if (roomCode) {
      navigate("/multiplayer/lobby");
    }
  }, [roomCode, navigate]);

  const handleCreateRoom = () => {
    createRoom(userId, username);
  };

  const handleJoinRoom = () => {
    if (joinCode.length === 6) {
      joinRoom(joinCode.toUpperCase(), userId, username);
    }
  };

  const handleCopyCode = () => {
    if (joinCode) {
      navigator.clipboard.writeText(joinCode.toUpperCase());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-display font-bold">Multiplayer</h1>
        </div>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400"
          >
            <p>{error}</p>
            <button onClick={clearError} className="text-sm underline mt-1">
              Dismiss
            </button>
          </motion.div>
        )}

        {/* Create Room */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <h2 className="text-lg font-semibold mb-2">Create a Room</h2>
          <p className="text-dark-400 text-sm mb-4">
            Start a new game and invite friends to join
          </p>
          <Button
            variant="accent"
            className="w-full"
            onClick={handleCreateRoom}
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Room
          </Button>
        </motion.div>

        {/* Divider */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-dark-700" />
          <span className="text-dark-500 text-sm">or</span>
          <div className="flex-1 h-px bg-dark-700" />
        </div>

        {/* Join Room */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <h2 className="text-lg font-semibold mb-2">Join a Room</h2>
          <p className="text-dark-400 text-sm mb-4">
            Enter a 6-character room code
          </p>

          <div className="flex gap-2 mb-4">
            <Input
              value={joinCode}
              onChange={(e) =>
                setJoinCode(e.target.value.toUpperCase().slice(0, 6))
              }
              placeholder="ABC123"
              className="text-center text-xl font-mono tracking-widest uppercase"
              maxLength={6}
            />
            {joinCode && (
              <Button variant="ghost" onClick={handleCopyCode}>
                {copied ? (
                  <Check className="w-5 h-5 text-accent-400" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </Button>
            )}
          </div>

          <Button
            variant="primary"
            className="w-full"
            onClick={handleJoinRoom}
            disabled={joinCode.length !== 6}
          >
            <LogIn className="w-5 h-5 mr-2" />
            Join Room
          </Button>
        </motion.div>
      </div>
    </PageTransition>
  );
}
