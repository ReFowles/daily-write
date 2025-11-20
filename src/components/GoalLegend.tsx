import type { Goal } from "@/lib/types";
import type { GoalColor } from "@/lib/constants";
import { GOAL_LEGEND_CLASSES, GOAL_COLOR_VALUES } from "@/lib/constants";
import { parseLocalDate } from "@/lib/date-utils";
import { themeClasses } from "@/lib/theme-utils";
import { cn } from "@/lib/class-utils";

interface GoalLegendProps {
  goals: Goal[];
  goalColorMap: Map<string, GoalColor>;
  currentYear: number;
  currentMonth: number;
}

export function GoalLegend({ goals, goalColorMap, currentYear, currentMonth }: GoalLegendProps) {
  if (goals.length === 0) {
    return null;
  }

  // Filter and sort goals by start date (earliest to latest)
  const visibleGoals = goals
    .filter((goal) => {
      const startDate = parseLocalDate(goal.startDate);
      const endDate = parseLocalDate(goal.endDate);
      const isInCurrentMonth =
        (startDate.getFullYear() === currentYear && startDate.getMonth() === currentMonth) ||
        (endDate.getFullYear() === currentYear && endDate.getMonth() === currentMonth) ||
        (startDate < new Date(currentYear, currentMonth, 1) && endDate > new Date(currentYear, currentMonth + 1, 0));
      return isInCurrentMonth;
    })
    .sort((a, b) => {
      const dateA = parseLocalDate(a.startDate);
      const dateB = parseLocalDate(b.startDate);
      return dateA.getTime() - dateB.getTime();
    });

  if (visibleGoals.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {visibleGoals.map((goal) => {
        const color = goalColorMap.get(goal.id) || "blue";
        const colorClasses = GOAL_LEGEND_CLASSES[color];
        const startDate = parseLocalDate(goal.startDate);
        const endDate = parseLocalDate(goal.endDate);
        const dateRangeText = startDate.getTime() === endDate.getTime()
          ? `(${startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })})`
          : `(${startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${endDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })})`;

        return (
          <div
            key={goal.id}
            className={`flex items-center gap-2 rounded-md border px-3 py-1.5 ${colorClasses}`}
          >
            <div
              className="h-3 w-3 rounded-full"
              style={{
                backgroundColor: GOAL_COLOR_VALUES[color],
              }}
            />
            <span className={cn("text-xs font-medium", themeClasses.text.link)}>
              {goal.dailyWordTarget} words/day
            </span>
            <span className={cn("text-xs", themeClasses.text.tertiary)}>
              {dateRangeText}
            </span>
          </div>
        );
      })}
    </div>
  );
}
