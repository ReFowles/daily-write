/**
 * Centralized theme color classes for the application.
 * Only entries actually referenced by components are kept — reach for one of
 * these tokens before hardcoding strawberry/cherry/seafoam/ocean variants.
 */

export const themeClasses = {
  // Text colors
  text: {
    primary: "text-zinc-900 dark:text-zinc-50 strawberry:text-rose-900 cherry:text-rose-300 seafoam:text-cyan-900 ocean:text-cyan-300",
    secondary: "text-zinc-600 dark:text-zinc-400 strawberry:text-rose-700 cherry:text-rose-400 seafoam:text-cyan-700 ocean:text-cyan-400",
    tertiary: "text-zinc-500 dark:text-zinc-500 strawberry:text-rose-500 cherry:text-rose-500 seafoam:text-cyan-500 ocean:text-cyan-500",
    muted: "text-zinc-500 dark:text-zinc-400 strawberry:text-rose-600 cherry:text-rose-500 seafoam:text-cyan-600 ocean:text-cyan-500",
    label: "text-zinc-700 dark:text-zinc-300 strawberry:text-rose-900 cherry:text-rose-300 seafoam:text-cyan-900 ocean:text-cyan-300",
    link: "text-zinc-700 dark:text-zinc-300 strawberry:text-rose-800 cherry:text-rose-300 seafoam:text-cyan-800 ocean:text-cyan-300",
  },

  // Background colors
  background: {
    card: "bg-white dark:bg-zinc-900 strawberry:bg-white cherry:bg-rose-950/50 seafoam:bg-white ocean:bg-cyan-950/50",
    page: "bg-zinc-50 dark:bg-zinc-950 strawberry:bg-linear-to-br strawberry:from-pink-50 strawberry:via-rose-50 strawberry:to-pink-100 cherry:bg-linear-to-br cherry:from-zinc-950 cherry:via-rose-950 cherry:to-zinc-950 seafoam:bg-linear-to-br seafoam:from-cyan-50 seafoam:via-blue-50 seafoam:to-cyan-100 ocean:bg-linear-to-br ocean:from-zinc-950 ocean:via-cyan-950 ocean:to-zinc-950",
    navBar: "bg-white dark:bg-zinc-950 strawberry:bg-linear-to-r strawberry:from-pink-50 strawberry:to-rose-50 cherry:bg-linear-to-r cherry:from-rose-950 cherry:to-pink-950 seafoam:bg-linear-to-r seafoam:from-cyan-50 seafoam:to-blue-50 ocean:bg-linear-to-r ocean:from-cyan-950 ocean:to-blue-950",
    overlay: "bg-white dark:bg-zinc-900 strawberry:bg-white cherry:bg-rose-950 seafoam:bg-white ocean:bg-cyan-950",
  },

  // Border colors
  border: {
    default: "border-zinc-200 dark:border-zinc-800 strawberry:border-pink-200 cherry:border-rose-900 seafoam:border-cyan-200 ocean:border-cyan-900",
    card: "border-zinc-200 dark:border-zinc-800 strawberry:border-rose-200 cherry:border-rose-900 seafoam:border-cyan-200 ocean:border-cyan-900",
    divider: "border-zinc-200 dark:border-zinc-800 strawberry:border-pink-200 cherry:border-rose-900 seafoam:border-cyan-200 ocean:border-cyan-900",
    navBar: "border-zinc-200 dark:border-zinc-800 strawberry:border-pink-200 cherry:border-rose-900 seafoam:border-cyan-200 ocean:border-cyan-900",
  },

  // Navigation link styles
  nav: {
    link: "rounded-md px-4 py-2 text-sm font-medium transition-colors",
    linkActive: "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50 strawberry:bg-rose-100 strawberry:text-rose-900 cherry:bg-rose-900 cherry:text-rose-100 seafoam:bg-cyan-100 seafoam:text-cyan-900 ocean:bg-cyan-900 ocean:text-cyan-100",
    linkInactive: "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50 strawberry:text-rose-700 strawberry:hover:bg-pink-100 strawberry:hover:text-rose-900 cherry:text-rose-400 cherry:hover:bg-rose-900 cherry:hover:text-rose-100 seafoam:text-cyan-700 seafoam:hover:bg-cyan-100 seafoam:hover:text-cyan-900 ocean:text-cyan-400 ocean:hover:bg-cyan-900 ocean:hover:text-cyan-100",
  },
};
