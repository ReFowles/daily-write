"use client";

import { useEffect } from "react";

export default function ThemeInit() {
  useEffect(() => {
    // Initialize theme from localStorage or system preference
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    // Remove all theme classes first
    document.documentElement.classList.remove("dark", "strawberry", "cherry", "seafoam", "ocean");
    
    // Apply saved theme or default
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else if (savedTheme === "strawberry") {
      document.documentElement.classList.add("strawberry");
    } else if (savedTheme === "cherry") {
      document.documentElement.classList.add("cherry");
    } else if (savedTheme === "seafoam") {
      document.documentElement.classList.add("seafoam");
    } else if (savedTheme === "ocean") {
      document.documentElement.classList.add("ocean");
    } else if (!savedTheme && prefersDark) {
      document.documentElement.classList.add("dark");
    }
  }, []);

  return null;
}
