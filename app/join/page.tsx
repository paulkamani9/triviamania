/**
 * Join Room Page
 *
 * Page for joining an existing room by entering a room code.
 * Supports direct URL joining via ?code=ABCD1234 query parameter.
 *
 * Route: /join
 */

import { Suspense } from 'react';
import { JoinContainer } from '@/components/features/join';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

/**
 * Loading fallback for Suspense boundary
 */
function JoinPageLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-violet-50 via-white to-purple-50 p-4 dark:from-zinc-950 dark:via-black dark:to-purple-950">
      <LoadingSpinner size="lg" />
    </div>
  );
}

/**
 * Join Room Page Component
 */
export default function JoinPage() {
  return (
    <Suspense fallback={<JoinPageLoading />}>
      <JoinContainer />
    </Suspense>
  );
}
