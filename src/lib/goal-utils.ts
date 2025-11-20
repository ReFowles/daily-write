import type { Goal } from "./types";
import type { GoalColor } from "./constants";
import { GOAL_COLORS } from "./constants";

/**
 * Create a map of goal IDs to their assigned colors
 * Colors are assigned cyclically from the GOAL_COLORS array
 */
export function createGoalColorMap(goals: Goal[]): Map<string, GoalColor> {
  const map = new Map<string, GoalColor>();
  goals.forEach((goal, index) => {
    map.set(goal.id, GOAL_COLORS[index % GOAL_COLORS.length]);
  });
  return map;
}
