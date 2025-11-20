"use client";

import { useState } from "react";
import { Card } from "./ui/Card";
import { CalendarDay } from "./CalendarDay";
import { CalendarHeader } from "./CalendarHeader";
import { GoalLegend } from "./GoalLegend";
import type { Goal, WritingSession } from "@/lib/types";
import type { GoalColor } from "@/lib/constants";
import {
  GOAL_COLORS,
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

interface MonthlyCalendarProps {
  goals: Goal[];
  writingSessions: WritingSession[];
}

export function MonthlyCalendar({ goals, writingSessions }: MonthlyCalendarProps) {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [isExpanded, setIsExpanded] = useState(true);

  // Assign colors to goals based on their index
  const goalColorMap = new Map<string, GoalColor>();
  goals.forEach((goal, index) => {
    goalColorMap.set(goal.id, GOAL_COLORS[index % GOAL_COLORS.length]);
  });

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

  const handlePreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
  };

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <Card className="p-4">
      <CalendarHeader
        monthName={getMonthName(currentMonth)}
        year={currentYear}
        isExpanded={isExpanded}
        onToggleExpand={() => setIsExpanded(!isExpanded)}
        onPreviousMonth={handlePreviousMonth}
        onNextMonth={handleNextMonth}
        onToday={handleToday}
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
                className="text-center text-xs font-semibold text-zinc-600 dark:text-zinc-400 strawberry:text-rose-700 cherry:text-rose-400 seafoam:text-cyan-700 ocean:text-cyan-400"
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
              <div key={weekIndex} className="grid grid-cols-7 gap-x-4 gap-y-2" role="row">
                {week.map((day, dayIndex) => {
                  const goal = getGoalForDate(day.date);
                  const isInGoalRange = goal !== null;
                  const goalColor = goal ? goalColorMap.get(goal.id) || "blue" : "blue";
                  const isGoalStart = goal && day.date ? isSameDate(day.date, goal.startDate) : false;
                  const isGoalEnd = goal && day.date ? isSameDate(day.date, goal.endDate) : false;

                  const wrapperClasses = cn(
                    "rounded-md p-1",
                    isInGoalRange && GOAL_BACKGROUND_CLASSES[goalColor],
                    isInGoalRange && (isGoalStart || isGoalEnd ? "border-2" : "border"),
                    isInGoalRange && GOAL_BORDER_CLASSES[goalColor]
                  );

                  return (
                    <div key={dayIndex} className={wrapperClasses}>
                      <CalendarDay
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
            ))}
          </div>
        </>
      )}
    </Card>
  );
}
