"use client";

import { Card } from "@/components/ui/Card";
import { DayCard } from "@/components/DayCard";
import { CalendarHeader } from "./CalendarHeader";
import type { Goal, WritingSession, RolloverDayInfo } from "@/lib/types";
import {
  computeGoalRollover,
  generateMonthGrid,
  getEffectiveDailyTargetForDate,
  getMonthName,
  isCheatDay,
  isDateInRange,
  isExcludedDay,
  isSameDate,
  toDateString,
} from "@/lib/date-utils";
import { cn } from "@/lib/class-utils";
import { useCalendarNavigation } from "@/lib/use-calendar-navigation";
import { useToggle } from "@/lib/use-toggle";
import { themeClasses } from "@/lib/theme-utils";
import { useMemo } from "react";

interface MonthlyCalendarProps {
  goals: Goal[];
  writingSessions: WritingSession[];
  onToggleCheatDay?: (goalId: string, date: string) => void;
  onToggleRolloverDay?: (goalId: string, date: string) => void;
}

export function MonthlyCalendar({ goals, writingSessions, onToggleCheatDay, onToggleRolloverDay }: MonthlyCalendarProps) {
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

  const todayDateString = toDateString(new Date());

  // Rollover spans a goal's whole range, so compute each map once per render.
  const rolloverByGoal = useMemo(() => {
    const map = new Map<string, Map<string, RolloverDayInfo>>();
    for (const goal of goals) {
      if (goal.rollover) {
        map.set(goal.id, computeGoalRollover(goal, writingSessions, todayDateString));
      }
    }
    return map;
  }, [goals, writingSessions, todayDateString]);

  const monthGrid = generateMonthGrid(currentYear, currentMonth, writingSessions);
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <Card className="p-2 sm:p-4">
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
          <div className="mb-2 grid grid-cols-7 gap-x-0 gap-y-2 sm:gap-x-4" role="row">
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
          <div className="space-y-0 sm:space-y-2" role="grid" aria-label="Monthly calendar view">
            {monthGrid.map((week, weekIndex) => (
              <div key={weekIndex} className="relative" role="row">
                {/* Background layer for goal highlighting - no gaps so colors flow continuously */}
                <div className="pointer-events-none absolute inset-0 grid grid-cols-7">
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
                      return <div key={dayIndex} />;
                    }

                    return (
                      <div key={dayIndex} className="relative h-full">
                        <div
                          className={cn(
                            "absolute inset-0",
                            // Neutral header color at lower opacity
                            "bg-surface-muted",
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
                <div className="relative grid grid-cols-7">
                  {week.map((day, dayIndex) => {
                    const goal = getGoalForDate(day.date);
                    const dateString = day.date ? toDateString(day.date) : null;
                    const excluded = goal && dateString ? isExcludedDay(goal, dateString) : false;
                    const cheatDay = goal && dateString ? isCheatDay(goal, dateString) : false;
                    const cheatRemaining = goal
                      ? (goal.cheatDaysAllowed ?? 0) - (goal.cheatDaysUsed ?? []).length
                      : 0;
                    const canToggleCheat =
                      !!goal && !!dateString && !!onToggleCheatDay && (cheatDay || cheatRemaining > 0);
                    const rollover =
                      goal && goal.rollover && dateString
                        ? rolloverByGoal.get(goal.id)?.get(dateString)
                        : undefined;

                    return (
                      <div key={dayIndex} className="min-w-0 px-0.5 py-0.5 sm:px-2 sm:py-2 md:px-4 md:py-3">
                        <DayCard
                          variant="compact"
                          date={day.date}
                          wordsWritten={day.wordsWritten}
                          goal={
                            goal && day.date
                              ? getEffectiveDailyTargetForDate(
                                  goal,
                                  toDateString(day.date),
                                  writingSessions,
                                  todayDateString
                                )
                              : null
                          }
                          isToday={day.isToday}
                          isFuture={day.isFuture}
                          casual={goal?.casual ?? false}
                          excludedDay={excluded}
                          cheatDay={cheatDay}
                          canToggleCheat={canToggleCheat}
                          onToggleCheat={
                            goal && dateString && onToggleCheatDay
                              ? () => onToggleCheatDay(goal.id, dateString)
                              : undefined
                          }
                          rescued={rollover?.rescued ?? false}
                          rolloverIn={rollover?.rolloverIn ?? 0}
                          excessLent={rollover?.excessLent ?? 0}
                          canRollover={(rollover?.canRescue ?? false) && !!onToggleRolloverDay}
                          onToggleRollover={
                            goal && goal.rollover && dateString && onToggleRolloverDay
                              ? () => onToggleRolloverDay(goal.id, dateString)
                              : undefined
                          }
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
