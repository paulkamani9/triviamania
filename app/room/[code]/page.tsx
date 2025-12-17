/**
 * Room Page
 *
 * Dynamic route for individual game rooms.
 * This page will display the lobby (Phase 6) and game play (Phase 7).
 *
 * Route: /room/[code]
 * Example: /room/ABCD1234
 */

interface RoomPageProps {
  params: Promise<{
    code: string;
  }>;
}

export default async function RoomPage({ params }: RoomPageProps) {
  const { code } = await params;

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-violet-50 via-white to-purple-50 p-4 dark:from-zinc-950 dark:via-black dark:to-purple-950">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-zinc-900 dark:text-white">
          Room: {code}
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          Lobby screen coming in Phase 6
        </p>
        <div className="p-6 bg-white dark:bg-zinc-900 rounded-lg shadow-lg max-w-md mx-auto">
          <p className="text-sm text-zinc-500 dark:text-zinc-500">
            This page will show:
          </p>
          <ul className="mt-4 space-y-2 text-left text-sm text-zinc-600 dark:text-zinc-400">
            <li>✓ Room code display</li>
            <li>✓ List of connected players</li>
            <li>✓ Host controls (Start Game button)</li>
            <li>✓ Real-time player updates</li>
            <li>✓ Share room link button</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
