import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark" | "strawberry" | "cherry" | "seafoam" | "ocean";

export interface ThemeMeta {
  value: Theme;
  label: string;
  kind: "light" | "dark";
}

export const THEMES: ReadonlyArray<ThemeMeta> = [
  { value: "light", label: "Light", kind: "light" },
  { value: "dark", label: "Dark", kind: "dark" },
  { value: "strawberry", label: "Strawberry", kind: "light" },
  { value: "cherry", label: "Cherry", kind: "dark" },
  { value: "seafoam", label: "Seafoam", kind: "light" },
  { value: "ocean", label: "Ocean", kind: "dark" },
];

const NON_LIGHT_THEMES = THEMES.filter((t) => t.value !== "light").map((t) => t.value);
const THEME_VALUES = THEMES.map((t) => t.value);

function readTheme(): Theme {
  if (typeof document === "undefined") return "light";
  const saved = localStorage.getItem("theme") as Theme | null;
  if (saved && (THEME_VALUES as string[]).includes(saved)) return saved;
  const applied = NON_LIGHT_THEMES.find((t) =>
    document.documentElement.classList.contains(t)
  );
  return applied ?? "light";
}

/**
 * Tracks the currently-applied theme and returns a setter that mutates the DOM
 * + localStorage. Multiple instances stay in sync via a MutationObserver on the
 * `<html>` class attribute — the DOM is the single source of truth.
 */
export function useAppliedTheme(): [Theme, (theme: Theme) => void] {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    // Defer to a microtask so setState doesn't happen synchronously in the effect body.
    queueMicrotask(() => setTheme(readTheme()));

    const observer = new MutationObserver(() => {
      const next = readTheme();
      setTheme((prev) => (prev === next ? prev : next));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  const applyTheme = useCallback((next: Theme) => {
    document.documentElement.classList.remove(...NON_LIGHT_THEMES);
    if (next !== "light") document.documentElement.classList.add(next);
    localStorage.setItem("theme", next);
    setTheme(next);
  }, []);

  return [theme, applyTheme];
}
