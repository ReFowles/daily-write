"use client";

import { useState, useRef, useEffect } from "react";
import { LuChevronDown, LuMoon, LuSun } from "react-icons/lu";

type Theme = "light" | "dark" | "strawberry" | "cherry" | "seafoam" | "ocean";

const THEMES: ReadonlyArray<{ value: Theme; label: string; kind: "light" | "dark" }> = [
  { value: "light", label: "Light", kind: "light" },
  { value: "dark", label: "Dark", kind: "dark" },
  { value: "strawberry", label: "Strawberry", kind: "light" },
  { value: "cherry", label: "Cherry", kind: "dark" },
  { value: "seafoam", label: "Seafoam", kind: "light" },
  { value: "ocean", label: "Ocean", kind: "dark" },
];

const THEME_VALUES = THEMES.map((t) => t.value);

// Reads the theme applied by ThemeInit. Must run only in the browser.
function readTheme(): Theme {
  const saved = localStorage.getItem("theme") as Theme | null;
  if (saved && (THEME_VALUES as string[]).includes(saved)) return saved;

  const applied = THEMES.find(
    (t) => t.value !== "light" && document.documentElement.classList.contains(t.value)
  );
  return applied?.value ?? "light";
}

function ThemeIcon({ kind }: { kind: "light" | "dark" }) {
  return kind === "light" ? <LuSun className="h-4 w-4" /> : <LuMoon className="h-4 w-4" />;
}

export default function ThemeToggle() {
  const [currentTheme, setCurrentTheme] = useState<Theme>("light");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Defer to a microtask so setState doesn't happen synchronously in the effect body.
    queueMicrotask(() => setCurrentTheme(readTheme()));
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const applyTheme = (theme: Theme) => {
    document.documentElement.classList.remove("dark", "strawberry", "cherry", "seafoam", "ocean");
    if (theme !== "light") {
      document.documentElement.classList.add(theme);
    }
    localStorage.setItem("theme", theme);
    setCurrentTheme(theme);
    setIsOpen(false);
  };

  const currentThemeData = THEMES.find((t) => t.value === currentTheme) ?? THEMES[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-md p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 strawberry:text-pink-600 strawberry:hover:bg-pink-100 cherry:text-rose-400 cherry:hover:bg-rose-950 seafoam:text-cyan-600 seafoam:hover:bg-cyan-100 ocean:text-cyan-400 ocean:hover:bg-cyan-950"
        aria-label="Change theme"
      >
        <ThemeIcon kind={currentThemeData.kind} />
        <span className="text-sm font-medium">{currentThemeData.label}</span>
        <LuChevronDown className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-48 rounded-md border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-800 strawberry:border-pink-200 strawberry:bg-pink-50 cherry:border-rose-800 cherry:bg-rose-950 seafoam:border-cyan-200 seafoam:bg-cyan-50 ocean:border-cyan-800 ocean:bg-cyan-950">
          <div className="py-1">
            {THEMES.map((theme) => (
              <button
                key={theme.value}
                onClick={() => applyTheme(theme.value)}
                className={`flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-700 strawberry:hover:bg-pink-100 cherry:hover:bg-rose-900 seafoam:hover:bg-cyan-100 ocean:hover:bg-cyan-900 ${
                  currentTheme === theme.value
                    ? "bg-zinc-100 font-medium text-zinc-900 dark:bg-zinc-700 dark:text-zinc-50 strawberry:bg-pink-100 strawberry:text-pink-900 cherry:bg-rose-900 cherry:text-rose-100 seafoam:bg-cyan-100 seafoam:text-cyan-900 ocean:bg-cyan-900 ocean:text-cyan-100"
                    : "text-zinc-700 dark:text-zinc-300 strawberry:text-pink-700 cherry:text-rose-300 seafoam:text-cyan-700 ocean:text-cyan-300"
                }`}
              >
                <ThemeIcon kind={theme.kind} />
                {theme.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
