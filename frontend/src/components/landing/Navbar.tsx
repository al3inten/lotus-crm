import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { LogIn, Sun, Moon, Menu, X } from "lucide-react";
import { EASE } from "../../lib/motion";
import { useTheme } from "../../hooks/useTheme";
import { FOCUS_RING } from "./shared";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggle } = useTheme();

  // Header renders opaque either once the page has scrolled, or while the mobile
  // menu is open — otherwise its top row stays transparent over the hero video.
  const navSolid = scrolled || mobileOpen;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    document.documentElement.style.scrollBehavior = "smooth";
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.documentElement.style.scrollBehavior = "";
    };
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        navSolid
          ? "border-b border-slate-200/80 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 sm:px-8">
        <a href="#top" className={clsx("flex items-center gap-3 rounded-lg", FOCUS_RING)}>
          <img src="/hyundai-logo.jpg" alt="Hyundai" className="h-9 w-auto rounded-md object-contain" />
          <span
            className={`text-lg font-semibold tracking-wide transition-colors ${
              navSolid ? "text-slate-900 dark:text-white" : "text-white"
            }`}
          >
            Lotus D-CRM
          </span>
        </a>
        <nav
          className={`hidden items-center gap-8 text-sm font-medium transition-colors md:flex ${
            navSolid ? "text-slate-600 dark:text-slate-300" : "text-slate-200"
          }`}
        >
          <a href="#features" className={clsx("rounded-lg transition-colors hover:text-blue-600 dark:hover:text-white", FOCUS_RING)}>Features</a>
          <a href="#pipeline" className={clsx("rounded-lg transition-colors hover:text-blue-600 dark:hover:text-white", FOCUS_RING)}>Pipeline</a>
          <a href="#impact" className={clsx("rounded-lg transition-colors hover:text-blue-600 dark:hover:text-white", FOCUS_RING)}>Impact</a>
        </nav>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggle}
            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            className={clsx(
              "flex h-10 w-10 items-center justify-center rounded-xl border transition-all hover:-translate-y-0.5",
              navSolid
                ? "border-slate-200 bg-white text-slate-600 hover:text-blue-600 dark:border-white/15 dark:bg-white/5 dark:text-slate-300 dark:hover:text-white"
                : "border-white/20 bg-white/10 text-white backdrop-blur-md hover:bg-white/20",
              FOCUS_RING
            )}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <Link
            to="/login"
            className={clsx(
              "inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:-translate-y-0.5 hover:bg-blue-500",
              FOCUS_RING
            )}
          >
            <LogIn size={16} />
            Sign In
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            className={clsx(
              "flex h-10 w-10 items-center justify-center rounded-xl border transition-all md:hidden",
              navSolid
                ? "border-slate-200 bg-white text-slate-600 dark:border-white/15 dark:bg-white/5 dark:text-slate-300"
                : "border-white/20 bg-white/10 text-white backdrop-blur-md",
              FOCUS_RING
            )}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile nav panel — the desktop links above are hidden below md, so this
          is the only way small-screen visitors can reach Features/Pipeline/Impact. */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="overflow-hidden border-b border-slate-200/80 bg-white/95 backdrop-blur-xl md:hidden dark:border-white/10 dark:bg-slate-950/95"
          >
            <nav className="flex flex-col gap-1 px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-300">
              {[
                { href: "#features", label: "Features" },
                { href: "#pipeline", label: "Pipeline" },
                { href: "#impact", label: "Impact" },
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={clsx(
                    "rounded-lg px-3 py-2.5 transition-colors hover:bg-slate-100 hover:text-blue-600 dark:hover:bg-white/5 dark:hover:text-white",
                    FOCUS_RING
                  )}
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
