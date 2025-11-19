"use client";

import { useState, useRef, useEffect } from "react";

type Theme = "light" | "dark" | "strawberry" | "dark-strawberry" | "ocean" | "dark-ocean";

export default function ThemeToggle() {
  const [currentTheme, setCurrentTheme] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme") as Theme;
      if (saved) return saved;
      if (document.documentElement.classList.contains("dark-ocean")) return "dark-ocean";
      if (document.documentElement.classList.contains("ocean")) return "ocean";
      if (document.documentElement.classList.contains("dark-strawberry")) return "dark-strawberry";
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
    document.documentElement.classList.remove("dark", "strawberry", "dark-strawberry", "ocean", "dark-ocean");
    
    // Apply new theme
    if (theme !== "light") {
      document.documentElement.classList.add(theme);
    }
    
    localStorage.setItem("theme", theme);
    setCurrentTheme(theme);
    setIsOpen(false);
  };

  const themes: Array<{ value: Theme; label: string; icon: React.ReactNode }> = [
    {
      value: "light",
      label: "Light",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
        </svg>
      ),
    },
    {
      value: "dark",
      label: "Dark",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
        </svg>
      ),
    },
    {
      value: "strawberry",
      label: "Strawberry",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
        </svg>
      ),
    },
    {
      value: "dark-strawberry",
      label: "Dark Strawberry",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25" />
        </svg>
      ),
    },
    {
      value: "ocean",
      label: "Ocean",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
        </svg>
      ),
    },
    {
      value: "dark-ocean",
      label: "Dark Ocean",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z M2.25 12C2.25 7.365 6.115 3.5 10.75 3.5" />
        </svg>
      ),
    },
  ];

  const currentThemeData = themes.find((t) => t.value === currentTheme) || themes[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-md p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 strawberry:text-pink-600 strawberry:hover:bg-pink-100 dark-strawberry:text-rose-400 dark-strawberry:hover:bg-rose-950 ocean:text-cyan-600 ocean:hover:bg-cyan-100 dark-ocean:text-cyan-400 dark-ocean:hover:bg-cyan-950"
        aria-label="Change theme"
      >
        {currentThemeData.icon}
        <span className="text-sm font-medium">{currentThemeData.label}</span>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-md border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-800 strawberry:border-pink-200 strawberry:bg-pink-50 dark-strawberry:border-rose-800 dark-strawberry:bg-rose-950 ocean:border-cyan-200 ocean:bg-cyan-50 dark-ocean:border-cyan-800 dark-ocean:bg-cyan-950">
          <div className="py-1">
            {themes.map((theme) => (
              <button
                key={theme.value}
                onClick={() => applyTheme(theme.value)}
                className={`flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-700 strawberry:hover:bg-pink-100 dark-strawberry:hover:bg-rose-900 ocean:hover:bg-cyan-100 dark-ocean:hover:bg-cyan-900 ${
                  currentTheme === theme.value
                    ? "bg-zinc-100 font-medium text-zinc-900 dark:bg-zinc-700 dark:text-zinc-50 strawberry:bg-pink-100 strawberry:text-pink-900 dark-strawberry:bg-rose-900 dark-strawberry:text-rose-100 ocean:bg-cyan-100 ocean:text-cyan-900 dark-ocean:bg-cyan-900 dark-ocean:text-cyan-100"
                    : "text-zinc-700 dark:text-zinc-300 strawberry:text-pink-700 dark-strawberry:text-rose-300 ocean:text-cyan-700 dark-ocean:text-cyan-300"
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
