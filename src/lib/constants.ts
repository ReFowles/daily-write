/**
 * Color constants and mappings for the application
 */

export type GoalColor = "blue" | "green" | "purple" | "orange" | "pink" | "red" | "yellow" | "teal";

// Color palette for distinguishing different goals
export const GOAL_COLORS: GoalColor[] = [
  "blue",
  "green",
  "purple",
  "orange",
  "pink",
  "red",
  "yellow",
  "teal",
];

// Hex color values for inline usage (e.g., small dots)
export const GOAL_COLOR_VALUES: Record<GoalColor, string> = {
  blue: "#3b82f6",
  green: "#22c55e",
  purple: "#a855f7",
  orange: "#f97316",
  pink: "#ec4899",
  red: "#ef4444",
  yellow: "#eab308",
  teal: "#14b8a6",
};

// Legend badge background and border classes
export const GOAL_LEGEND_CLASSES: Record<GoalColor, string> = {
  blue: "bg-blue-500/20 border-blue-500/50",
  green: "bg-green-500/20 border-green-500/50",
  purple: "bg-purple-500/20 border-purple-500/50",
  orange: "bg-orange-500/20 border-orange-500/50",
  pink: "bg-pink-500/20 border-pink-500/50",
  red: "bg-red-500/20 border-red-500/50",
  yellow: "bg-yellow-500/20 border-yellow-500/50",
  teal: "bg-teal-500/20 border-teal-500/50",
};

// Calendar cell background classes for goal ranges
export const GOAL_BACKGROUND_CLASSES: Record<GoalColor, string> = {
  blue: "bg-blue-500/10 dark:bg-blue-500/20 strawberry:bg-blue-500/15 cherry:bg-blue-500/25 seafoam:bg-blue-500/15 ocean:bg-blue-500/25",
  green: "bg-green-500/10 dark:bg-green-500/20 strawberry:bg-green-500/15 cherry:bg-green-500/25 seafoam:bg-green-500/15 ocean:bg-green-500/25",
  purple: "bg-purple-500/10 dark:bg-purple-500/20 strawberry:bg-purple-500/15 cherry:bg-purple-500/25 seafoam:bg-purple-500/15 ocean:bg-purple-500/25",
  orange: "bg-orange-500/10 dark:bg-orange-500/20 strawberry:bg-orange-500/15 cherry:bg-orange-500/25 seafoam:bg-orange-500/15 ocean:bg-orange-500/25",
  pink: "bg-pink-500/10 dark:bg-pink-500/20 strawberry:bg-pink-500/15 cherry:bg-pink-500/25 seafoam:bg-pink-500/15 ocean:bg-pink-500/25",
  red: "bg-red-500/10 dark:bg-red-500/20 strawberry:bg-red-500/15 cherry:bg-red-500/25 seafoam:bg-red-500/15 ocean:bg-red-500/25",
  yellow: "bg-yellow-500/10 dark:bg-yellow-500/20 strawberry:bg-yellow-500/15 cherry:bg-yellow-500/25 seafoam:bg-yellow-500/15 ocean:bg-yellow-500/25",
  teal: "bg-teal-500/10 dark:bg-teal-500/20 strawberry:bg-teal-500/15 cherry:bg-teal-500/25 seafoam:bg-teal-500/15 ocean:bg-teal-500/25",
};

// Calendar cell border classes for goal ranges
export const GOAL_BORDER_CLASSES: Record<GoalColor, string> = {
  blue: "border-blue-500/40 dark:border-blue-500/60 strawberry:border-blue-500/50 cherry:border-blue-500/70 seafoam:border-blue-500/50 ocean:border-blue-500/70",
  green: "border-green-500/40 dark:border-green-500/60 strawberry:border-green-500/50 cherry:border-green-500/70 seafoam:border-green-500/50 ocean:border-green-500/70",
  purple: "border-purple-500/40 dark:border-purple-500/60 strawberry:border-purple-500/50 cherry:border-purple-500/70 seafoam:border-purple-500/50 ocean:border-purple-500/70",
  orange: "border-orange-500/40 dark:border-orange-500/60 strawberry:border-orange-500/50 cherry:border-orange-500/70 seafoam:border-orange-500/50 ocean:border-orange-500/70",
  pink: "border-pink-500/40 dark:border-pink-500/60 strawberry:border-pink-500/50 cherry:border-pink-500/70 seafoam:border-pink-500/50 ocean:border-pink-500/70",
  red: "border-red-500/40 dark:border-red-500/60 strawberry:border-red-500/50 cherry:border-red-500/70 seafoam:border-red-500/50 ocean:border-red-500/70",
  yellow: "border-yellow-500/40 dark:border-yellow-500/60 strawberry:border-yellow-500/50 cherry:border-yellow-500/70 seafoam:border-yellow-500/50 ocean:border-yellow-500/70",
  teal: "border-teal-500/40 dark:border-teal-500/60 strawberry:border-teal-500/50 cherry:border-teal-500/70 seafoam:border-teal-500/50 ocean:border-teal-500/70",
};
