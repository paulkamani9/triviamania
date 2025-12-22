import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Play, ChevronDown } from "lucide-react";
import { CATEGORIES, DIFFICULTIES } from "../constants";
import PageTransition from "../components/PageTransition";
import Button from "../components/Button";

export default function SinglePlayerConfig() {
  const navigate = useNavigate();
  const [category, setCategory] = useState(null);
  const [difficulty, setDifficulty] = useState(null);

  const handleStart = () => {
    navigate("/single-player/game", {
      state: { category, difficulty },
    });
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
          <h1 className="text-2xl font-display font-bold">Single Player</h1>
        </div>

        {/* Category Selection */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <label className="block text-sm text-dark-400 mb-3">Category</label>
          <div className="relative">
            <select
              value={category || ""}
              onChange={(e) =>
                setCategory(e.target.value ? parseInt(e.target.value) : null)
              }
              className="input appearance-none pr-10"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.id ?? "any"} value={cat.id ?? ""}>
                  {cat.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400 pointer-events-none" />
          </div>
        </motion.div>

        {/* Difficulty Selection */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <label className="block text-sm text-dark-400 mb-3">Difficulty</label>
          <div className="grid grid-cols-4 gap-2">
            {DIFFICULTIES.map((diff) => (
              <button
                key={diff.id ?? "any"}
                onClick={() => setDifficulty(diff.id)}
                className={`px-4 py-3 rounded-xl font-medium transition-all
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
        </motion.div>

        {/* Start Button */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            variant="accent"
            size="lg"
            className="w-full"
            onClick={handleStart}
          >
            <Play className="w-5 h-5 mr-2" />
            Start Game
          </Button>
        </motion.div>
      </div>
    </PageTransition>
  );
}
