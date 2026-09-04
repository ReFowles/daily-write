"use client";

import { useEffect } from "react";

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

const SAVED_THEMES = new Set([
  "light",
  "dark",
  "strawberry",
  "cherry",
  "seafoam",
  "ocean",
  "sunrise",
  "sunset",
  "energy",
  "ambition",
]);

export default function ThemeInit() {
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const html = document.documentElement;

    html.classList.remove(...MANAGED_CLASSES);

    if (savedTheme && SAVED_THEMES.has(savedTheme)) {
      if (savedTheme !== "light") {
        html.classList.add(savedTheme);
        if (savedTheme === "ambition") html.classList.add("dark");
      }
    } else if (prefersDark) {
      html.classList.add("dark");
    }
  }, []);

  return null;
}
