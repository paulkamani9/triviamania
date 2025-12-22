import { Outlet } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

export default function Layout() {
  return (
    <div className="min-h-screen bg-dark-950 text-dark-100">
      {/* Skip to main content for keyboard navigation */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

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
