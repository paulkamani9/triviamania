import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";
import { useMusicStore } from "../store/musicStore";

export default function Layout() {
  const location = useLocation();
  const { isPlaying, isMuted, toggleMusic, setIsInGame, initMusic } =
    useMusicStore();

  // Determine if user is in active gameplay
  const isInGamePath = location.pathname.includes("/game");

  // Update volume based on game state
  useEffect(() => {
    setIsInGame(isInGamePath);
  }, [isInGamePath, setIsInGame]);

  // Initialize music on first interaction
  useEffect(() => {
    const handleFirstInteraction = () => {
      initMusic();
      document.removeEventListener("click", handleFirstInteraction);
      document.removeEventListener("keydown", handleFirstInteraction);
    };

    document.addEventListener("click", handleFirstInteraction);
    document.addEventListener("keydown", handleFirstInteraction);

    return () => {
      document.removeEventListener("click", handleFirstInteraction);
      document.removeEventListener("keydown", handleFirstInteraction);
    };
  }, [initMusic]);

  return (
    <div className="min-h-screen bg-dark-950 text-dark-100">
      {/* Skip to main content for keyboard navigation */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Music Toggle - Fixed position */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
        onClick={toggleMusic}
        className={`fixed top-4 right-4 z-50 p-3 rounded-full transition-all duration-300
          ${
            isPlaying && !isMuted
              ? "bg-primary-600 hover:bg-primary-500 text-white"
              : "bg-dark-800 hover:bg-dark-700 text-dark-400 border border-dark-600"
          }`}
        title={isPlaying ? "Turn off music" : "Turn on music"}
        aria-label={
          isPlaying ? "Turn off background music" : "Turn on background music"
        }
      >
        {isPlaying && !isMuted ? (
          <Volume2 className="w-5 h-5" />
        ) : (
          <VolumeX className="w-5 h-5" />
        )}
      </motion.button>

      <main
        id="main-content"
        className="container mx-auto px-4 py-6 max-w-2xl"
        tabIndex={-1}
      >
        <AnimatePresence mode="wait">
          <Outlet />
        </AnimatePresence>
      </main>
    </div>
  );
}
