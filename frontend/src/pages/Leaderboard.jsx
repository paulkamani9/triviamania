import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Trophy, Medal, Award, User, Loader2 } from "lucide-react";
import { useUserStore } from "../store/userStore";
import PageTransition from "../components/PageTransition";
import Button from "../components/Button";

export default function Leaderboard() {
  const { userId, isAuthenticated } = useUserStore();
  const [leaderboard, setLeaderboard] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        setLoading(true);

        // Fetch top 100
        const res = await fetch("/api/leaderboard");
        if (!res.ok) throw new Error("Failed to fetch leaderboard");
        const data = await res.json();
        setLeaderboard(data.data || []);

        // Fetch user rank if authenticated
        if (isAuthenticated && userId) {
          const rankRes = await fetch(`/api/leaderboard/user/${userId}`);
          if (rankRes.ok) {
            const rankData = await rankRes.json();
            setUserRank(rankData.data);
          }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
  }, [userId, isAuthenticated]);

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-400" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-300" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="w-5 text-dark-400 text-sm">#{rank}</span>;
    }
  };

  const getRankBg = (rank, isCurrentUser) => {
    if (isCurrentUser) return "bg-primary-600/20 border-primary-500";
    switch (rank) {
      case 1:
        return "bg-yellow-400/10 border-yellow-400/50";
      case 2:
        return "bg-gray-300/10 border-gray-400/50";
      case 3:
        return "bg-amber-600/10 border-amber-600/50";
      default:
        return "bg-dark-800 border-dark-700";
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
          <div>
            <h1 className="text-2xl font-display font-bold">Leaderboard</h1>
            <p className="text-dark-400 text-sm">Top 100 Players</p>
          </div>
        </div>

        {/* User Rank Card */}
        {userRank && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="card bg-gradient-to-r from-primary-600/20 to-accent-500/20 border-primary-500/50"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-600/50 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary-300" />
                </div>
                <div>
                  <p className="text-sm text-dark-400">Your Rank</p>
                  <p className="text-xl font-bold text-primary-400">
                    #{userRank.rank}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-dark-400">Total Score</p>
                <p className="text-xl font-mono font-bold">
                  {userRank.totalPoints}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-400" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="card text-center text-red-400">
            <p>{error}</p>
          </div>
        )}

        {/* Leaderboard List */}
        {!loading && !error && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="space-y-2"
          >
            {leaderboard.length === 0 ? (
              <div className="card text-center">
                <p className="text-dark-400">No players yet. Be the first!</p>
              </div>
            ) : (
              leaderboard.map((player, index) => {
                const rank = index + 1;
                const isCurrentUser = player.id === userId;

                return (
                  <motion.div
                    key={player.id}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    className={`flex items-center gap-4 p-3 rounded-xl border transition-colors
                      ${getRankBg(rank, isCurrentUser)}`}
                  >
                    <div className="w-8 flex justify-center">
                      {getRankIcon(rank)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p
                        className={`font-medium truncate ${
                          isCurrentUser ? "text-primary-400" : ""
                        }`}
                      >
                        {player.username}
                        {isCurrentUser && " (you)"}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-mono font-bold">
                        {player.totalPoints}
                      </p>
                    </div>
                  </motion.div>
                );
              })
            )}
          </motion.div>
        )}

        {/* Sign in prompt */}
        {!isAuthenticated && !loading && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="card text-center"
          >
            <p className="text-dark-400 mb-3">
              Sign in to track your rank and appear on the leaderboard
            </p>
            <Link to="/">
              <Button variant="primary">Sign In</Button>
            </Link>
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
}
