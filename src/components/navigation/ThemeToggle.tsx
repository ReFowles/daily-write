"use client";

import { useState, useRef, useEffect } from "react";
import { LuChevronDown, LuMoon, LuSun } from "react-icons/lu";
import { cn } from "@/lib/class-utils";
import { THEMES, useAppliedTheme, type Theme } from "@/lib/use-applied-theme";

function ThemeIcon({ kind }: { kind: "light" | "dark" }) {
  return kind === "light" ? <LuSun className="h-4 w-4" /> : <LuMoon className="h-4 w-4" />;
}

// Pairs mirror the About page. Order matters — light theme on the left,
// its dark counterpart on the right.
const THEME_PAIRS: ReadonlyArray<{ light: Theme; dark: Theme }> = [
  { light: "light", dark: "dark" },
  { light: "strawberry", dark: "cherry" },
  { light: "seafoam", dark: "ocean" },
  { light: "sunrise", dark: "sunset" },
  { light: "energy", dark: "ambition" },
];

interface ThemeToggleProps {
  align?: "left" | "right";
}

export default function ThemeToggle({ align = "right" }: ThemeToggleProps = {}) {
  const [currentTheme, applyTheme] = useAppliedTheme();
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

  const selectTheme = (theme: Theme) => {
    applyTheme(theme);
    setIsOpen(false);
  };

  const currentThemeData = THEMES.find((t) => t.value === currentTheme) ?? THEMES[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-md p-2 text-fg-muted transition-colors hover:bg-surface-muted"
        aria-label="Change theme"
      >
        <ThemeIcon kind={currentThemeData.kind} />
        <span className="text-sm font-medium">{currentThemeData.label}</span>
        <LuChevronDown className="h-4 w-4" />
      </button>

      {isOpen && (
        <div
          className={cn(
            "absolute z-50 mt-2 w-72 rounded-md border border-line bg-surface shadow-lg",
            align === "right" ? "right-0" : "left-0"
          )}
          role="menu"
        >
          <div className="grid grid-cols-2 gap-1 p-1">
            {THEME_PAIRS.flatMap((pair) => [
              <ThemeItem
                key={pair.light}
                theme={pair.light}
                isActive={currentTheme === pair.light}
                onSelect={selectTheme}
              />,
              <ThemeItem
                key={pair.dark}
                theme={pair.dark}
                isActive={currentTheme === pair.dark}
                onSelect={selectTheme}
              />,
            ])}
          </div>
        </div>
      )}
    </div>
  );
}

function ThemeItem({
  theme,
  isActive,
  onSelect,
}: {
  theme: Theme;
  isActive: boolean;
  onSelect: (theme: Theme) => void;
}) {
  const meta = THEMES.find((t) => t.value === theme);
  if (!meta) return null;

  return (
    <button
      onClick={() => onSelect(theme)}
      role="menuitemradio"
      aria-checked={isActive}
      className={cn(
        "flex items-center gap-2 rounded px-3 py-2 text-left text-sm transition-colors",
        isActive
          ? "bg-accent-subtle text-accent-subtle-fg font-medium"
          : "text-fg-muted hover:bg-surface-muted hover:text-fg"
      )}
    >
      <ThemeIcon kind={meta.kind} />
      {meta.label}
    </button>
  );
}
