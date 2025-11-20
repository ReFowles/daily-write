"use client";

import { Card } from "./ui/Card";
import { DayCard } from "./DayCard";
import { CalendarHeader } from "./CalendarHeader";
import { GoalLegend } from "./GoalLegend";
import type { Goal, WritingSession } from "@/lib/types";
import {
  GOAL_BACKGROUND_CLASSES,
  GOAL_BORDER_CLASSES,
} from "@/lib/constants";
import {
  generateMonthGrid,
  getMonthName,
  isDateInRange,
  isSameDate,
} from "@/lib/date-utils";
import { cn } from "@/lib/class-utils";
import { useCalendarNavigation } from "@/lib/use-calendar-navigation";
import { useToggle } from "@/lib/use-toggle";
import { createGoalColorMap } from "@/lib/goal-utils";
import { themeClasses } from "@/lib/theme-utils";

interface MonthlyCalendarProps {
  goals: Goal[];
  writingSessions: WritingSession[];
}

export function MonthlyCalendar({ goals, writingSessions }: MonthlyCalendarProps) {
  const { year: currentYear, month: currentMonth, goToPreviousMonth, goToNextMonth, goToToday } = useCalendarNavigation();
  const { isOpen: isExpanded, toggle: toggleExpanded } = useToggle(true);

  // Assign colors to goals based on their index
  const goalColorMap = createGoalColorMap(goals);

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
      >
        <GoalLegend
          goals={goals}
          goalColorMap={goalColorMap}
          currentYear={currentYear}
          currentMonth={currentMonth}
        />
      </CalendarHeader>

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
                    const goalColor = goal ? goalColorMap.get(goal.id) || "blue" : "blue";
                    const isGoalStart = goal && day.date ? isSameDate(day.date, goal.startDate) : false;
                    const isGoalEnd = goal && day.date ? isSameDate(day.date, goal.endDate) : false;
                    
                    // Check if previous/next day has the same goal
                    const prevGoal = dayIndex > 0 ? getGoalForDate(week[dayIndex - 1].date) : null;
                    const nextGoal = dayIndex < 6 ? getGoalForDate(week[dayIndex + 1].date) : null;
                    const hasSamePrevGoal = prevGoal?.id === goal?.id;
                    const hasSameNextGoal = nextGoal?.id === goal?.id;
                    
                    const isStartOfSpan = isGoalStart || !hasSamePrevGoal;
                    const isEndOfSpan = isGoalEnd || !hasSameNextGoal;

                    if (!goal) {
                      return <div key={dayIndex} className="flex-1" />;
                    }

                    // For Sunday (0) and Saturday (6), we need special handling
                    const needsLeftPadding = isStartOfSpan && dayIndex === 6;
                    const needsRightPadding = isEndOfSpan && dayIndex === 0;

                    return (
                      <div key={dayIndex} className="flex-1 h-full relative">
                        <div
                          className={cn(
                            "absolute inset-0",
                            GOAL_BACKGROUND_CLASSES[goalColor],
                            // Rounded corners only at start/end of continuous spans
                            isStartOfSpan && "rounded-l-lg",
                            isEndOfSpan && "rounded-r-lg",
                            // Border styling
                            "border-y",
                            isStartOfSpan && "border-l-2",
                            isEndOfSpan && "border-r-2",
                            GOAL_BORDER_CLASSES[goalColor],
                            // Inset the background slightly on Sat/Sun edges
                            needsLeftPadding && "left-2",
                            needsRightPadding && "right-2"
                          )}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Calendar days layer */}
                <div className="relative grid grid-cols-7 gap-x-4">
                  {week.map((day, dayIndex) => {
                    const goal = getGoalForDate(day.date);

                    return (
                      <div key={dayIndex} className="my-1">
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
