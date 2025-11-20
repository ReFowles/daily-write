"use client";

import { useState, useRef, useEffect } from "react";
import { Sun, Moon, ChevronDown } from "./icons";

type Theme = "light" | "dark" | "strawberry" | "cherry" | "seafoam" | "ocean";

export default function ThemeToggle() {
  const [currentTheme, setCurrentTheme] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme") as Theme;
      if (saved) return saved;
      if (document.documentElement.classList.contains("ocean")) return "ocean";
      if (document.documentElement.classList.contains("seafoam")) return "seafoam";
      if (document.documentElement.classList.contains("cherry")) return "cherry";
      if (document.documentElement.classList.contains("dark")) return "dark";
      if (document.documentElement.classList.contains("strawberry")) return "strawberry";
    }
    return "light";
  });
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    // Remove all theme classes
    document.documentElement.classList.remove("dark", "strawberry", "cherry", "seafoam", "ocean");
    
    // Apply new theme
    if (theme !== "light") {
      document.documentElement.classList.add(theme);
    }
    
    localStorage.setItem("theme", theme);
    setCurrentTheme(theme);
    setIsOpen(false);
  };

  const themes: Array<{ value: Theme; label: string; icon: React.ReactNode }> = [
    { value: "light", label: "Light", icon: <Sun /> },
    { value: "dark", label: "Dark", icon: <Moon /> },
    { value: "strawberry", label: "Strawberry", icon: <Sun /> },
    { value: "cherry", label: "Cherry", icon: <Moon /> },
    { value: "seafoam", label: "Seafoam", icon: <Sun /> },
    { value: "ocean", label: "Ocean", icon: <Moon /> },
  ];

  const currentThemeData = themes.find((t) => t.value === currentTheme) || themes[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-md p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 strawberry:text-pink-600 strawberry:hover:bg-pink-100 cherry:text-rose-400 cherry:hover:bg-rose-950 seafoam:text-cyan-600 seafoam:hover:bg-cyan-100 ocean:text-cyan-400 ocean:hover:bg-cyan-950"
        aria-label="Change theme"
      >
        {currentThemeData.icon}
        <span className="text-sm font-medium">{currentThemeData.label}</span>
        <ChevronDown />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-md border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-800 strawberry:border-pink-200 strawberry:bg-pink-50 cherry:border-rose-800 cherry:bg-rose-950 seafoam:border-cyan-200 seafoam:bg-cyan-50 ocean:border-cyan-800 ocean:bg-cyan-950">
          <div className="py-1">
            {themes.map((theme) => (
              <button
                key={theme.value}
                onClick={() => applyTheme(theme.value)}
                className={`flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-700 strawberry:hover:bg-pink-100 cherry:hover:bg-rose-900 seafoam:hover:bg-cyan-100 ocean:hover:bg-cyan-900 ${
                  currentTheme === theme.value
                    ? "bg-zinc-100 font-medium text-zinc-900 dark:bg-zinc-700 dark:text-zinc-50 strawberry:bg-pink-100 strawberry:text-pink-900 cherry:bg-rose-900 cherry:text-rose-100 seafoam:bg-cyan-100 seafoam:text-cyan-900 ocean:bg-cyan-900 ocean:text-cyan-100"
                    : "text-zinc-700 dark:text-zinc-300 strawberry:text-pink-700 cherry:text-rose-300 seafoam:text-cyan-700 ocean:text-cyan-300"
                }`}
              >
                {theme.icon}
                {theme.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
