"use client";

import { Card } from "./ui/Card";
import { DayCard } from "./DayCard";
import { CalendarHeader } from "./CalendarHeader";
import type { Goal, WritingSession } from "@/lib/types";
import {
  generateMonthGrid,
  getMonthName,
  isDateInRange,
  isSameDate,
} from "@/lib/date-utils";
import { cn } from "@/lib/class-utils";
import { useCalendarNavigation } from "@/lib/use-calendar-navigation";
import { useToggle } from "@/lib/use-toggle";
import { themeClasses } from "@/lib/theme-utils";

interface MonthlyCalendarProps {
  goals: Goal[];
  writingSessions: WritingSession[];
}

export function MonthlyCalendar({ goals, writingSessions }: MonthlyCalendarProps) {
  const { year: currentYear, month: currentMonth, goToPreviousMonth, goToNextMonth, goToToday } = useCalendarNavigation();
  const { isOpen: isExpanded, toggle: toggleExpanded } = useToggle(true);

  // Find which goal (if any) applies to a given date
  const getGoalForDate = (date: Date | null): Goal | null => {
    if (!date) return null;
    
    for (const goal of goals) {
      if (isDateInRange(date, goal.startDate, goal.endDate)) {
        return goal;
      }
    }
    
    return null;
  };

  const monthGrid = generateMonthGrid(currentYear, currentMonth, writingSessions);
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <Card className="p-4">
      <CalendarHeader
        monthName={getMonthName(currentMonth)}
        year={currentYear}
        isExpanded={isExpanded}
        onToggleExpand={toggleExpanded}
        onPreviousMonth={goToPreviousMonth}
        onNextMonth={goToNextMonth}
        onToday={goToToday}
      />

      {isExpanded && (
        <>
          {/* Day name headers */}
          <div className="mb-2 grid grid-cols-7 gap-x-4 gap-y-2" role="row">
            {dayNames.map((day) => (
              <div
                key={day}
                className={cn("text-center text-xs font-semibold", themeClasses.text.secondary)}
                role="columnheader"
                aria-label={day}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="space-y-2" role="grid" aria-label="Monthly calendar view">
            {monthGrid.map((week, weekIndex) => (
              <div key={weekIndex} className="relative" role="row">
                {/* Background layer for goal highlighting - no gaps so colors flow continuously */}
                <div className="absolute inset-0 flex pointer-events-none">
                  {week.map((day, dayIndex) => {
                    const goal = getGoalForDate(day.date);
                    const isGoalStart = goal && day.date ? isSameDate(day.date, goal.startDate) : false;
                    const isGoalEnd = goal && day.date ? isSameDate(day.date, goal.endDate) : false;
                    
                    // Check if previous/next day has the same goal
                    const prevGoal = dayIndex > 0 ? getGoalForDate(week[dayIndex - 1].date) : null;
                    const nextGoal = dayIndex < 6 ? getGoalForDate(week[dayIndex + 1].date) : null;
                    const hasSamePrevGoal = prevGoal?.id === goal?.id;
                    const hasSameNextGoal = nextGoal?.id === goal?.id;
                    
                    // Only cap borders if this is truly the start/end of the goal period
                    const shouldCapLeft = isGoalStart && !hasSamePrevGoal;
                    const shouldCapRight = isGoalEnd && !hasSameNextGoal;
                    
                    // Add spacing when a goal ends and another begins on adjacent days
                    const prevGoalEnds = prevGoal && !hasSamePrevGoal && prevGoal !== goal;
                    const nextGoalStarts = nextGoal && !hasSameNextGoal && nextGoal !== goal;

                    if (!goal) {
                      return <div key={dayIndex} className="flex-1" />;
                    }

                    return (
                      <div key={dayIndex} className="flex-1 h-full relative">
                        <div
                          className={cn(
                            "absolute inset-0",
                            // Neutral header color at lower opacity
                            "bg-zinc-200/30 dark:bg-zinc-800/30 strawberry:bg-rose-200/30 cherry:bg-rose-900/30 seafoam:bg-cyan-200/30 ocean:bg-cyan-900/30",
                            // Rounded corners only if truly at goal start/end
                            shouldCapLeft && "rounded-l-lg",
                            shouldCapRight && "rounded-r-lg",
                            // Thick dashed border styling
                            "border-y-4 border-dashed",
                            themeClasses.border.default,
                            shouldCapLeft && "border-l-4",
                            shouldCapRight && "border-r-4",
                            // Add horizontal spacing when goals transition
                            prevGoalEnds && shouldCapLeft && "ml-2",
                            nextGoalStarts && shouldCapRight && "mr-2"
                          )}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Calendar days layer */}
                <div className="relative flex">
                  {week.map((day, dayIndex) => {
                    const goal = getGoalForDate(day.date);

                    return (
                      <div key={dayIndex} className="flex-1 px-4 py-3">
                        <DayCard
                          variant="compact"
                          date={day.date}
                          wordsWritten={day.wordsWritten}
                          goal={goal?.dailyWordTarget ?? null}
                          isToday={day.isToday}
                          isFuture={day.isFuture}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}
