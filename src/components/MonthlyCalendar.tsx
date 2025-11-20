"use client";

import { useState } from "react";
import { Card } from "./ui/Card";
import { CalendarDay } from "./CalendarDay";
import { Goal, WritingSession } from "@/app/goals/page";
import {
  generateMonthGrid,
  getMonthName,
  isDateInRange,
  isSameDate,
} from "@/lib/date-utils";

interface MonthlyCalendarProps {
  goals: Goal[];
  writingSessions: WritingSession[];
}

// Color palette for distinguishing different goals
const GOAL_COLORS = [
  "blue",
  "green",
  "purple",
  "orange",
  "pink",
  "red",
  "yellow",
  "teal",
];

export function MonthlyCalendar({ goals, writingSessions }: MonthlyCalendarProps) {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [isExpanded, setIsExpanded] = useState(true);

  // Assign colors to goals based on their index
  const goalColorMap = new Map<string, string>();
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
      {/* Header with navigation and legend */}
      <div className={`flex items-center justify-between gap-4 ${isExpanded ? "mb-4" : ""}`}>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50 strawberry:text-rose-900 cherry:text-rose-300 seafoam:text-cyan-900 ocean:text-cyan-300 hover:opacity-70 transition-opacity"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-transform ${isExpanded ? "rotate-90" : ""}`}
            >
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
            {getMonthName(currentMonth)} {currentYear}
          </button>
          
          {/* Goal Legend */}
          {goals.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {goals.map((goal) => {
            const color = goalColorMap.get(goal.id) || "blue";
            const colorClasses: Record<string, string> = {
              blue: "bg-blue-500/20 border-blue-500/50",
              green: "bg-green-500/20 border-green-500/50",
              purple: "bg-purple-500/20 border-purple-500/50",
              orange: "bg-orange-500/20 border-orange-500/50",
              pink: "bg-pink-500/20 border-pink-500/50",
              red: "bg-red-500/20 border-red-500/50",
              yellow: "bg-yellow-500/20 border-yellow-500/50",
              teal: "bg-teal-500/20 border-teal-500/50",
            };

            const startDate = new Date(goal.startDate + "T00:00:00");
            const endDate = new Date(goal.endDate + "T00:00:00");
            const isInCurrentMonth =
              (startDate.getFullYear() === currentYear && startDate.getMonth() === currentMonth) ||
              (endDate.getFullYear() === currentYear && endDate.getMonth() === currentMonth) ||
              (startDate < new Date(currentYear, currentMonth, 1) && endDate > new Date(currentYear, currentMonth + 1, 0));

            if (!isInCurrentMonth) return null;

            return (
              <div
                key={goal.id}
                className={`flex items-center gap-2 rounded-md border px-3 py-1.5 ${colorClasses[color] || colorClasses.blue}`}
              >
                <div
                  className={`h-3 w-3 rounded-full`}
                  style={{
                    backgroundColor: color === "blue" ? "#3b82f6" :
                      color === "green" ? "#22c55e" :
                      color === "purple" ? "#a855f7" :
                      color === "orange" ? "#f97316" :
                      color === "pink" ? "#ec4899" :
                      color === "red" ? "#ef4444" :
                      color === "yellow" ? "#eab308" :
                      "#14b8a6"
                  }}
                />
                <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 strawberry:text-rose-800 cherry:text-rose-300 seafoam:text-cyan-800 ocean:text-cyan-300">
                  {goal.dailyWordTarget} words/day
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-500">
                  ({new Date(goal.startDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })} - {new Date(goal.endDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })})
                </span>
              </div>
            );
          })}
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePreviousMonth}
            className="rounded-md p-2 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 strawberry:hover:bg-rose-100 cherry:hover:bg-rose-900 seafoam:hover:bg-cyan-100 ocean:hover:bg-cyan-900"
            aria-label="Previous month"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-zinc-700 dark:text-zinc-300 strawberry:text-rose-800 cherry:text-rose-300 seafoam:text-cyan-800 ocean:text-cyan-300"
            >
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <button
            onClick={handleToday}
            className="rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 strawberry:hover:bg-rose-100 cherry:hover:bg-rose-900 seafoam:hover:bg-cyan-100 ocean:hover:bg-cyan-900 text-zinc-700 dark:text-zinc-300 strawberry:text-rose-800 cherry:text-rose-300 seafoam:text-cyan-800 ocean:text-cyan-300"
          >
            Today
          </button>
          <button
            onClick={handleNextMonth}
            className="rounded-md p-2 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 strawberry:hover:bg-rose-100 cherry:hover:bg-rose-900 seafoam:hover:bg-cyan-100 ocean:hover:bg-cyan-900"
            aria-label="Next month"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-zinc-700 dark:text-zinc-300 strawberry:text-rose-800 cherry:text-rose-300 seafoam:text-cyan-800 ocean:text-cyan-300"
            >
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          {/* Day name headers */}
          <div className="mb-2 grid grid-cols-7 gap-x-4 gap-y-2">
            {dayNames.map((day) => (
              <div
                key={day}
                className="text-center text-xs font-semibold text-zinc-600 dark:text-zinc-400 strawberry:text-rose-700 cherry:text-rose-400 seafoam:text-cyan-700 ocean:text-cyan-400"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="space-y-2">
        {monthGrid.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-x-6 gap-y-4">
            {week.map((day, dayIndex) => {
              const goal = getGoalForDate(day.date);
              const isInGoalRange = goal !== null;
              const goalColor = goal ? goalColorMap.get(goal.id) || "blue" : "blue";
              const isGoalStart = goal && day.date ? isSameDate(day.date, goal.startDate) : false;
              const isGoalEnd = goal && day.date ? isSameDate(day.date, goal.endDate) : false;

              // Goal wrapper background classes
              const getGoalWrapperBg = () => {
                if (!isInGoalRange) return "";
                const colorMap: Record<string, string> = {
                  blue: "bg-blue-500/10 dark:bg-blue-500/20 strawberry:bg-blue-500/15 cherry:bg-blue-500/25 seafoam:bg-blue-500/15 ocean:bg-blue-500/25",
                  green: "bg-green-500/10 dark:bg-green-500/20 strawberry:bg-green-500/15 cherry:bg-green-500/25 seafoam:bg-green-500/15 ocean:bg-green-500/25",
                  purple: "bg-purple-500/10 dark:bg-purple-500/20 strawberry:bg-purple-500/15 cherry:bg-purple-500/25 seafoam:bg-purple-500/15 ocean:bg-purple-500/25",
                  orange: "bg-orange-500/10 dark:bg-orange-500/20 strawberry:bg-orange-500/15 cherry:bg-orange-500/25 seafoam:bg-orange-500/15 ocean:bg-orange-500/25",
                  pink: "bg-pink-500/10 dark:bg-pink-500/20 strawberry:bg-pink-500/15 cherry:bg-pink-500/25 seafoam:bg-pink-500/15 ocean:bg-pink-500/25",
                  red: "bg-red-500/10 dark:bg-red-500/20 strawberry:bg-red-500/15 cherry:bg-red-500/25 seafoam:bg-red-500/15 ocean:bg-red-500/25",
                  yellow: "bg-yellow-500/10 dark:bg-yellow-500/20 strawberry:bg-yellow-500/15 cherry:bg-yellow-500/25 seafoam:bg-yellow-500/15 ocean:bg-yellow-500/25",
                  teal: "bg-teal-500/10 dark:bg-teal-500/20 strawberry:bg-teal-500/15 cherry:bg-teal-500/25 seafoam:bg-teal-500/15 ocean:bg-teal-500/25",
                };
                return colorMap[goalColor] || colorMap.blue;
              };

              // Goal wrapper border classes
              const getGoalWrapperBorder = () => {
                if (!isInGoalRange) return "";
                const colorMap: Record<string, string> = {
                  blue: "border-blue-500/40 dark:border-blue-500/60 strawberry:border-blue-500/50 cherry:border-blue-500/70 seafoam:border-blue-500/50 ocean:border-blue-500/70",
                  green: "border-green-500/40 dark:border-green-500/60 strawberry:border-green-500/50 cherry:border-green-500/70 seafoam:border-green-500/50 ocean:border-green-500/70",
                  purple: "border-purple-500/40 dark:border-purple-500/60 strawberry:border-purple-500/50 cherry:border-purple-500/70 seafoam:border-purple-500/50 ocean:border-purple-500/70",
                  orange: "border-orange-500/40 dark:border-orange-500/60 strawberry:border-orange-500/50 cherry:border-orange-500/70 seafoam:border-orange-500/50 ocean:border-orange-500/70",
                  pink: "border-pink-500/40 dark:border-pink-500/60 strawberry:border-pink-500/50 cherry:border-pink-500/70 seafoam:border-pink-500/50 ocean:border-pink-500/70",
                  red: "border-red-500/40 dark:border-red-500/60 strawberry:border-red-500/50 cherry:border-red-500/70 seafoam:border-red-500/50 ocean:border-red-500/70",
                  yellow: "border-yellow-500/40 dark:border-yellow-500/60 strawberry:border-yellow-500/50 cherry:border-yellow-500/70 seafoam:border-yellow-500/50 ocean:border-yellow-500/70",
                  teal: "border-teal-500/40 dark:border-teal-500/60 strawberry:border-teal-500/50 cherry:border-teal-500/70 seafoam:border-teal-500/50 ocean:border-teal-500/70",
                };
                const borderWeight = isGoalStart || isGoalEnd ? "border-2" : "border";
                const borderColor = colorMap[goalColor] || colorMap.blue;
                return `${borderWeight} ${borderColor}`;
              };

              return (
                <div
                  key={dayIndex}
                  className={`rounded-md p-1 ${isInGoalRange ? `${getGoalWrapperBg()} ${getGoalWrapperBorder()}` : ""}`}
                >
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
