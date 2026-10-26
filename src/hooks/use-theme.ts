import { useSyncExternalStore } from "react";

export type Theme = "light" | "dark";

function subscribe(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}

function getSnapshot(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function getServerSnapshot(): Theme {
  return "light";
}

export function setTheme(theme: Theme): void {
  document.documentElement.classList.toggle("dark", theme === "dark");
  try {
    localStorage.setItem("theme", theme);
  } catch {
    // Ignore write errors (e.g. storage disabled).
  }
}

/**
 * Minimal theme hook that mirrors the subset of the `next-themes` API used
 * across the template. The active theme is derived from the `.dark` class on
 * the document element, which is set on first paint by the inline script in
 * `BaseHead.astro` and toggled here via `setTheme`.
 */
export function useTheme(): {
  theme: Theme;
  resolvedTheme: Theme;
  setTheme: (theme: Theme) => void;
} {
  const resolvedTheme = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  return { theme: resolvedTheme, resolvedTheme, setTheme };
}
