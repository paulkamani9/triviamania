/**
 * JoinView Component
 *
 * Presentational component for the join room interface.
 * Displays room code input, join button, and error messages.
 */

'use client';

import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { RoomCodeInput, isValidRoomCodeFormat } from './RoomCodeInput';
import type { JoinViewProps } from './types';

/**
 * JoinView - Presentational component for joining rooms
 */
export function JoinView({
  roomCode,
  onRoomCodeChange,
  onJoinRoom,
  isValidating,
  isJoining,
  error,
}: JoinViewProps) {
  const isLoading = isValidating || isJoining;
  const isCodeValid = isValidRoomCodeFormat(roomCode);
  const canJoin = isCodeValid && !isLoading;

  /**
   * Handle form submission
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canJoin) {
      onJoinRoom();
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-violet-50 via-white to-purple-50 p-4 dark:from-zinc-950 dark:via-black dark:to-purple-950">
      <Card className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-white">
            Join Room
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Enter the room code to join the game
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Room Code Input */}
          <RoomCodeInput
            value={roomCode}
            onChange={onRoomCodeChange}
            disabled={isLoading}
            error={error}
            autoFocus
          />

          {/* Join Button */}
          <Button
            type="submit"
            variant="primary"
            disabled={!canJoin}
            className="w-full"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <LoadingSpinner size="sm" />
                <span>{isValidating ? 'Validating...' : 'Joining...'}</span>
              </div>
            ) : (
              'Join Room'
            )}
          </Button>
        </form>

        {/* Help Text */}
        <div className="text-center">
          <p className="text-sm text-zinc-500 dark:text-zinc-500">
            Don&apos;t have a room code?{' '}
            <a
              href="/"
              className="text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 underline"
            >
              Create a room
            </a>
          </p>
        </div>
      </Card>
    </div>
  );
}
