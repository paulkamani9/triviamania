import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Users, Trophy, Zap, LogIn, RefreshCw } from "lucide-react";
import { useUserStore } from "../store/userStore";
import { signInWithGoogle } from "../services/supabase";
import PageTransition from "../components/PageTransition";
import Button from "../components/Button";
import Modal from "../components/Modal";
import Input from "../components/Input";

export default function Home() {
  const { username, isAuthenticated, setUsername, regenerateUsername } =
    useUserStore();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editingName, setEditingName] = useState("");

  const handleOpenProfile = () => {
    setEditingName(username || "");
    setShowProfileModal(true);
  };

  const handleSaveUsername = () => {
    if (editingName.trim().length >= 2) {
      setUsername(editingName);
      setShowProfileModal(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Sign in failed:", error);
    }
  };

  return (
    <PageTransition>
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
        {/* Logo & Title */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          className="mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Zap className="w-12 h-12 text-primary-500" />
            <h1 className="text-5xl font-display font-bold bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
              TriviaMania
            </h1>
          </div>
          <p className="text-dark-400 text-lg">Real-time multiplayer trivia</p>
        </motion.div>

        {/* Profile Section */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <button
            onClick={handleOpenProfile}
            className="flex items-center gap-3 px-4 py-3 bg-dark-800 hover:bg-dark-700 
                     rounded-xl border border-dark-600 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <p className="text-sm text-dark-400">Playing as</p>
              <p className="font-semibold text-dark-100">{username}</p>
            </div>
          </button>
        </motion.div>

        {/* Main Action Buttons */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="w-full max-w-sm space-y-4"
        >
          <Link to="/single-player" className="block">
            <Button variant="primary" size="lg" className="w-full">
              <User className="w-5 h-5 mr-2" />
              Single Player
            </Button>
          </Link>

          <Link to="/multiplayer" className="block">
            <Button variant="accent" size="lg" className="w-full">
              <Users className="w-5 h-5 mr-2" />
              Multiplayer
            </Button>
          </Link>

          <Link to="/leaderboard" className="block">
            <Button variant="secondary" size="lg" className="w-full">
              <Trophy className="w-5 h-5 mr-2" />
              Leaderboard
            </Button>
          </Link>
        </motion.div>

        {/* Auth Prompt */}
        {!isAuthenticated && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-8 p-4 bg-dark-900 border border-dark-700 rounded-xl"
          >
            <p className="text-dark-400 text-sm mb-3">
              Sign in to save your scores to the leaderboard!
            </p>
            <Button variant="ghost" onClick={handleGoogleSignIn}>
              <LogIn className="w-4 h-4 mr-2" />
              Sign in with Google
            </Button>
          </motion.div>
        )}
      </div>

      {/* Profile Edit Modal */}
      <Modal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        title="Edit Profile"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-dark-400 mb-2">Username</label>
            <div className="flex gap-2">
              <Input
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                placeholder="Enter username"
                maxLength={30}
              />
              <Button
                variant="ghost"
                onClick={() => {
                  regenerateUsername();
                  setEditingName(useUserStore.getState().username);
                }}
                title="Generate random name"
              >
                <RefreshCw className="w-5 h-5" />
              </Button>
            </div>
            <p className="text-xs text-dark-500 mt-1">2-30 characters</p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setShowProfileModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleSaveUsername}
              disabled={editingName.trim().length < 2}
            >
              Save
            </Button>
          </div>
        </div>
      </Modal>
    </PageTransition>
  );
}
