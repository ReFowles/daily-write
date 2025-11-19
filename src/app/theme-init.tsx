"use client";

import { useEffect } from "react";

export default function ThemeInit() {
  useEffect(() => {
    // Initialize theme from localStorage or system preference
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    // Remove all theme classes first
    document.documentElement.classList.remove("dark", "strawberry", "dark-strawberry", "ocean", "dark-ocean");
    
    // Apply saved theme or default
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else if (savedTheme === "strawberry") {
      document.documentElement.classList.add("strawberry");
    } else if (savedTheme === "dark-strawberry") {
      document.documentElement.classList.add("dark-strawberry");
    } else if (savedTheme === "ocean") {
      document.documentElement.classList.add("ocean");
    } else if (savedTheme === "dark-ocean") {
      document.documentElement.classList.add("dark-ocean");
    } else if (!savedTheme && prefersDark) {
      document.documentElement.classList.add("dark");
    }
  }, []);

  return null;
}
