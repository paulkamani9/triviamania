/**
 * PlayerCard Component
 *
 * Displays player information in a card format.
 * Shows player name, host badge, rank, and score.
 * Animates on mount and supports layout animations for reordering.
 *
 * @example
 * ```tsx
 * <PlayerCard
 *   player={player}
 *   rank={1}
 *   showScore={true}
 * />
 * ```
 */

import { motion } from 'framer-motion';
import { Player } from '@/types';
import { fadeIn } from '@/components/motion/variants';

interface PlayerCardProps {
  player: Player;
  rank?: number;
  showScore?: boolean;
}

export function PlayerCard({
  player,
  rank,
  showScore = true,
}: PlayerCardProps) {
  const getRankColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-100 text-yellow-800';
    if (rank === 2) return 'bg-gray-100 text-gray-700';
    if (rank === 3) return 'bg-orange-100 text-orange-700';
    return 'bg-blue-100 text-blue-700';
  };

  return (
    <motion.div
      className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
      variants={fadeIn}
      layout
      layoutId={player.id}
    >
      <div className="flex items-center gap-3">
        {rank && (
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${getRankColor(rank)}`}
            aria-label={`Rank ${rank}`}
          >
            {rank}
          </div>
        )}
        <div>
          <p className="font-medium text-gray-900">
            {player.name}
            {player.is_host && (
              <span
                className="ml-2 rounded bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800"
                aria-label="Host"
              >
                Host
              </span>
            )}
          </p>
        </div>
      </div>
      {showScore && (
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900">{player.score}</p>
          <p className="text-xs text-gray-500">points</p>
        </div>
      )}
    </motion.div>
  );
}
