import { useEffect, lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { useUserStore } from "./store/userStore";
import { onAuthStateChange } from "./services/supabase";
import Layout from "./components/Layout";

// Lazy load pages for code splitting
const Home = lazy(() => import("./pages/Home"));
const SinglePlayerConfig = lazy(() => import("./pages/SinglePlayerConfig"));
const SinglePlayerGame = lazy(() => import("./pages/SinglePlayerGame"));
const MultiplayerHub = lazy(() => import("./pages/MultiplayerHub"));
const Lobby = lazy(() => import("./pages/Lobby"));
const MultiplayerGame = lazy(() => import("./pages/MultiplayerGame"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));

// Loading fallback component
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  const { initUser, setAuthUser } = useUserStore();

  useEffect(() => {
    // Initialize anonymous user
    initUser();

    // Listen for auth state changes
    const unsubscribe = onAuthStateChange((event, session) => {
      setAuthUser(session?.user || null);
    });

    return () => unsubscribe();
  }, [initUser, setAuthUser]);

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="single-player" element={<SinglePlayerConfig />} />
          <Route path="single-player/game" element={<SinglePlayerGame />} />
          <Route path="multiplayer" element={<MultiplayerHub />} />
          <Route path="multiplayer/lobby" element={<Lobby />} />
          <Route path="multiplayer/game" element={<MultiplayerGame />} />
          <Route path="leaderboard" element={<Leaderboard />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
