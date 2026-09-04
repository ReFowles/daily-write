import { useCallback, useEffect, useState } from "react";

export type Theme =
  | "light"
  | "dark"
  | "strawberry"
  | "cherry"
  | "seafoam"
  | "ocean"
  | "sunrise"
  | "sunset"
  | "energy"
  | "ambition";

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
  { value: "sunrise", label: "Sunrise", kind: "light" },
  { value: "sunset", label: "Sunset", kind: "dark" },
  { value: "energy", label: "Energy", kind: "light" },
  { value: "ambition", label: "Ambition", kind: "dark" },
];

// Themes whose <html> class we add/remove. Every non-Light theme adds its own
// class; Ambition additionally piggybacks on `dark` so it inherits the dark
// palette beneath the rainbow overlay.
const MANAGED_CLASSES = [
  "dark",
  "strawberry",
  "cherry",
  "seafoam",
  "ocean",
  "sunrise",
  "sunset",
  "energy",
  "ambition",
] as const;

const THEME_VALUES = THEMES.map((t) => t.value);

// The primary class that identifies each theme on <html>. `light` has none.
const THEME_PRIMARY_CLASS: Record<Exclude<Theme, "light">, string> = {
  dark: "dark",
  strawberry: "strawberry",
  cherry: "cherry",
  seafoam: "seafoam",
  ocean: "ocean",
  sunrise: "sunrise",
  sunset: "sunset",
  energy: "energy",
  ambition: "ambition",
};

function readTheme(): Theme {
  if (typeof document === "undefined") return "light";
  const saved = localStorage.getItem("theme") as Theme | null;
  if (saved && (THEME_VALUES as string[]).includes(saved)) return saved;
  const html = document.documentElement;
  // Prefer the more specific (non-dark) theme classes when both are present.
  const applied = (Object.keys(THEME_PRIMARY_CLASS) as Array<keyof typeof THEME_PRIMARY_CLASS>)
    .filter((t) => t !== "dark")
    .find((t) => html.classList.contains(THEME_PRIMARY_CLASS[t]));
  if (applied) return applied;
  if (html.classList.contains("dark")) return "dark";
  return "light";
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
    document.documentElement.classList.remove(...MANAGED_CLASSES);
    if (next !== "light") {
      document.documentElement.classList.add(THEME_PRIMARY_CLASS[next]);
      // Ambition inherits the dark palette; add `dark` alongside `ambition`.
      if (next === "ambition") document.documentElement.classList.add("dark");
    }
    localStorage.setItem("theme", next);
    setTheme(next);
  }, []);

  return [theme, applyTheme];
}
