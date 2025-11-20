/**
 * Centralized theme color classes for the application
 * This reduces duplication of theme-specific Tailwind classes across components
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
    body: "text-zinc-700 dark:text-zinc-300 strawberry:text-rose-800 cherry:text-rose-400 seafoam:text-cyan-800 ocean:text-cyan-400",
  },

  // Background colors
  background: {
    card: "bg-white dark:bg-zinc-900 strawberry:bg-white cherry:bg-rose-950/50 seafoam:bg-white ocean:bg-cyan-950/50",
    page: "bg-zinc-50 dark:bg-zinc-950 strawberry:bg-linear-to-br strawberry:from-pink-50 strawberry:via-rose-50 strawberry:to-pink-100 cherry:bg-linear-to-br cherry:from-zinc-950 cherry:via-rose-950 cherry:to-zinc-950 seafoam:bg-linear-to-br seafoam:from-cyan-50 seafoam:via-blue-50 seafoam:to-cyan-100 ocean:bg-linear-to-br ocean:from-zinc-950 ocean:via-cyan-950 ocean:to-zinc-950",
    input: "bg-white dark:bg-zinc-900 strawberry:bg-white cherry:bg-rose-950 seafoam:bg-white ocean:bg-cyan-950",
    hover: "hover:bg-zinc-50 dark:hover:bg-zinc-900 strawberry:hover:bg-pink-100 cherry:hover:bg-rose-900 seafoam:hover:bg-cyan-100 ocean:hover:bg-cyan-900",
    hoverAlt: "hover:bg-zinc-100 dark:hover:bg-zinc-800 strawberry:hover:bg-rose-100 cherry:hover:bg-rose-900 seafoam:hover:bg-cyan-100 ocean:hover:bg-cyan-900",
    active: "bg-zinc-100 dark:bg-zinc-800 strawberry:bg-rose-100 cherry:bg-rose-900 seafoam:bg-cyan-100 ocean:bg-cyan-900",
    transparent: "bg-transparent",
    navBar: "bg-white dark:bg-zinc-950 strawberry:bg-linear-to-r strawberry:from-pink-50 strawberry:to-rose-50 cherry:bg-linear-to-r cherry:from-rose-950 cherry:to-pink-950 seafoam:bg-linear-to-r seafoam:from-cyan-50 seafoam:to-blue-50 ocean:bg-linear-to-r ocean:from-cyan-950 ocean:to-blue-950",
    button: {
      primary: "bg-blue-600 hover:bg-blue-700 strawberry:bg-linear-to-r strawberry:from-rose-500 strawberry:to-pink-500 strawberry:hover:from-rose-600 strawberry:hover:to-pink-600 cherry:bg-linear-to-r cherry:from-rose-700 cherry:to-pink-700 cherry:hover:from-rose-600 cherry:hover:to-pink-600 seafoam:bg-linear-to-r seafoam:from-cyan-500 seafoam:to-blue-500 seafoam:hover:from-cyan-600 seafoam:hover:to-blue-600 ocean:bg-linear-to-r ocean:from-cyan-700 ocean:to-blue-700 ocean:hover:from-cyan-600 ocean:hover:to-blue-600",
      secondary: "bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 strawberry:bg-white strawberry:hover:bg-rose-50 cherry:bg-rose-950 cherry:hover:bg-rose-900 seafoam:bg-white seafoam:hover:bg-cyan-50 ocean:bg-cyan-950 ocean:hover:bg-cyan-900",
    },
  },

  // Border colors
  border: {
    default: "border-zinc-200 dark:border-zinc-800 strawberry:border-pink-200 cherry:border-rose-900 seafoam:border-cyan-200 ocean:border-cyan-900",
    input: "border-zinc-300 dark:border-zinc-700 strawberry:border-rose-300 cherry:border-rose-800 seafoam:border-cyan-300 ocean:border-cyan-800",
    card: "border-zinc-200 dark:border-zinc-800 strawberry:border-rose-200 cherry:border-rose-900 seafoam:border-cyan-200 ocean:border-cyan-900",
    divider: "border-zinc-200 dark:border-zinc-800 strawberry:border-pink-200 cherry:border-rose-900 seafoam:border-cyan-200 ocean:border-cyan-900",
    focus: "focus:border-blue-500 focus:ring-1 focus:ring-blue-500 strawberry:focus:border-rose-500 strawberry:focus:ring-rose-500 cherry:focus:border-rose-600 cherry:focus:ring-rose-600 seafoam:focus:border-cyan-500 seafoam:focus:ring-cyan-500 ocean:focus:border-cyan-600 ocean:focus:ring-cyan-600",
    navBar: "border-zinc-200 dark:border-zinc-800 strawberry:border-pink-200 cherry:border-rose-900 seafoam:border-cyan-200 ocean:border-cyan-900",
  },

  // Shadow colors
  shadow: {
    card: "strawberry:shadow-sm strawberry:shadow-pink-100 cherry:shadow-sm cherry:shadow-rose-950 seafoam:shadow-sm seafoam:shadow-cyan-100 ocean:shadow-sm ocean:shadow-cyan-950",
    hover: "hover:shadow-md strawberry:hover:shadow-pink-200 cherry:hover:shadow-rose-900 seafoam:hover:shadow-cyan-200 ocean:hover:shadow-cyan-900",
  },

  // Combined button styles
  button: {
    primary: "rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 strawberry:bg-linear-to-r strawberry:from-rose-500 strawberry:to-pink-500 strawberry:hover:from-rose-600 strawberry:hover:to-pink-600 cherry:bg-linear-to-r cherry:from-rose-700 cherry:to-pink-700 cherry:hover:from-rose-600 cherry:hover:to-pink-600 seafoam:bg-linear-to-r seafoam:from-cyan-500 seafoam:to-blue-500 seafoam:hover:from-cyan-600 seafoam:hover:to-blue-600 ocean:bg-linear-to-r ocean:from-cyan-700 ocean:to-blue-700 ocean:hover:from-cyan-600 ocean:hover:to-blue-600",
    secondary: "rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 strawberry:border-rose-300 strawberry:bg-white strawberry:text-rose-700 strawberry:hover:bg-rose-50 cherry:border-rose-800 cherry:bg-rose-950 cherry:text-rose-300 cherry:hover:bg-rose-900 seafoam:border-cyan-300 seafoam:bg-white seafoam:text-cyan-700 seafoam:hover:bg-cyan-50 ocean:border-cyan-800 ocean:bg-cyan-950 ocean:text-cyan-300 ocean:hover:bg-cyan-900",
    icon: "rounded-md p-2 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 strawberry:hover:bg-rose-100 cherry:hover:bg-rose-900 seafoam:hover:bg-cyan-100 ocean:hover:bg-cyan-900",
  },

  // Input field styles
  input: {
    base: "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 strawberry:border-rose-300 strawberry:focus:border-rose-500 strawberry:focus:ring-rose-500 cherry:border-rose-800 cherry:bg-rose-950 cherry:text-rose-100 cherry:focus:border-rose-600 cherry:focus:ring-rose-600 seafoam:border-cyan-300 seafoam:focus:border-cyan-500 seafoam:focus:ring-cyan-500 ocean:border-cyan-800 ocean:bg-cyan-950 ocean:text-cyan-100 ocean:focus:border-cyan-600 ocean:focus:ring-cyan-600",
    placeholder: "placeholder-zinc-500 dark:placeholder-zinc-400",
  },

  // Navigation link styles
  nav: {
    link: "rounded-md px-4 py-2 text-sm font-medium transition-colors",
    linkActive: "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50 strawberry:bg-rose-100 strawberry:text-rose-900 cherry:bg-rose-900 cherry:text-rose-100 seafoam:bg-cyan-100 seafoam:text-cyan-900 ocean:bg-cyan-900 ocean:text-cyan-100",
    linkInactive: "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50 strawberry:text-rose-700 strawberry:hover:bg-pink-100 strawberry:hover:text-rose-900 cherry:text-rose-400 cherry:hover:bg-rose-900 cherry:hover:text-rose-100 seafoam:text-cyan-700 seafoam:hover:bg-cyan-100 seafoam:hover:text-cyan-900 ocean:text-cyan-400 ocean:hover:bg-cyan-900 ocean:hover:text-cyan-100",
  },
};
