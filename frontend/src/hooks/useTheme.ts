import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "lotus_theme";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const saved = window.localStorage.getItem(STORAGE_KEY);
  // Default to the light ("white") theme; only go dark if explicitly chosen before.
  return saved === "dark" ? "dark" : "light";
}

/**
 * App-wide light/dark theme, class-based to match Tailwind's `dark:` variant
 * (`@custom-variant dark (&:is(.dark *))` in index.css). Toggles the `.dark`
 * class on <html> and persists the choice. Light is the default.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggle = useCallback(() => setTheme((t) => (t === "dark" ? "light" : "dark")), []);

  return { theme, setTheme, toggle };
}
