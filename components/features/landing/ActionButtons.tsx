'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/common';
import { staggerItem } from '@/components/motion';
import type { ActionButtonsProps } from './types';

/**
 * ActionButtons Component
 *
 * Create Room and Join Room action buttons with stagger animation.
 * Displays loading state when creating a room.
 *
 * @example
 * ```tsx
 * <ActionButtons
 *   onCreateRoom={handleCreate}
 *   onJoinRoom={handleJoin}
 *   disabled={!isNameValid}
 *   isCreating={loading}
 * />
 * ```
 */
export function ActionButtons({
  onCreateRoom,
  onJoinRoom,
  disabled,
  isCreating,
}: ActionButtonsProps) {
  return (
    <div className="flex flex-col gap-3 w-full">
      <motion.div variants={staggerItem}>
        <Button
          onClick={onCreateRoom}
          disabled={disabled}
          isLoading={isCreating}
          size="lg"
          variant="primary"
          className="w-full"
        >
          Create Room
        </Button>
      </motion.div>

      <motion.div variants={staggerItem}>
        <Button
          onClick={onJoinRoom}
          disabled={disabled || isCreating}
          size="lg"
          variant="secondary"
          className="w-full"
        >
          Join Room
        </Button>
      </motion.div>
    </div>
  );
}
