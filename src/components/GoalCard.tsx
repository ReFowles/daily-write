"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { Goal, WritingSession } from "@/lib/types";
import { formatDate, parseLocalDate } from "@/lib/date-utils";

interface GoalCardProps {
  goal: Goal;
  writingSessions: WritingSession[];
  onDelete: (goalId: string) => void;
}

export function GoalCard({ goal, writingSessions, onDelete }: GoalCardProps) {
  const [showLoggedDays, setShowLoggedDays] = useState(false);

  // Calculate stats
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const startDate = parseLocalDate(goal.startDate);
  const endDate = parseLocalDate(goal.endDate);
  const isCompleted = endDate < now;
  
  const totalDays = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;

  // Filter writing sessions that fall within this goal's date range
  const goalSessions = writingSessions.filter((session) => {
    const sessionDate = parseLocalDate(session.date);
    return sessionDate >= startDate && sessionDate <= endDate;
  });

  // Create a map of date -> wordCount for logged days display
  const wordsByDate: Record<string, number> = {};
  goalSessions.forEach((session) => {
    wordsByDate[session.date] = session.wordCount;
  });

  const daysLogged = goalSessions.length;
  const totalWordsWritten = goalSessions.reduce((sum, session) => sum + session.wordCount, 0);
  const targetTotalWords = totalDays * goal.dailyWordTarget;
  const progress = Math.min((totalWordsWritten / targetTotalWords) * 100, 100);
  
  // For average calculation: use total days if goal is completed or past, otherwise use elapsed days (excluding today)
  const goalIsInPast = endDate < now;
  const elapsedDays = goalIsInPast 
    ? totalDays 
    : Math.max(1, Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
  const averageWordsPerDay = daysLogged > 0 ? Math.round(totalWordsWritten / elapsedDays) : 0;

  return (
    <Card className={`p-6 ${isCompleted ? "opacity-75" : ""}`}>
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 strawberry:text-rose-900 cherry:text-rose-300 seafoam:text-cyan-900 ocean:text-cyan-300">
                {formatDate(goal.startDate)} - {formatDate(goal.endDate)}
              </h3>
              {isCompleted && (
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                  progress >= 100
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 cherry:bg-green-900 cherry:text-green-200 ocean:bg-green-900 ocean:text-green-200"
                    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 cherry:bg-red-900 cherry:text-red-200 ocean:bg-red-900 ocean:text-red-200"
                }`}>
                  {progress >= 100 ? "Goal Met ✓" : "Goal Not Met"}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400 strawberry:text-rose-700 cherry:text-rose-400 seafoam:text-cyan-700 ocean:text-cyan-400">
              {goal.dailyWordTarget} words/day for {totalDays} days
            </p>
          </div>
          <button
            onClick={() => onDelete(goal.id)}
            className="text-zinc-400 transition-colors hover:text-red-600 dark:text-zinc-500 dark:hover:text-red-400"
            aria-label="Delete goal"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-zinc-900 dark:text-zinc-50 strawberry:text-rose-900 cherry:text-rose-300 seafoam:text-cyan-900 ocean:text-cyan-300">
              {totalWordsWritten.toLocaleString()} / {targetTotalWords.toLocaleString()} words • Avg: {averageWordsPerDay} words/day
            </span>
            <span className="text-zinc-600 dark:text-zinc-400 strawberry:text-rose-700 cherry:text-rose-400 seafoam:text-cyan-700 ocean:text-cyan-400">
              {Math.round(progress)}%
            </span>
          </div>
          <ProgressBar value={progress} size="md" isCompleted={isCompleted} />
        </div>

        {/* Logged Days */}
        {daysLogged > 0 && (
          <div className="border-t border-zinc-200 pt-4 dark:border-zinc-800 strawberry:border-pink-200 cherry:border-rose-900 seafoam:border-cyan-200 ocean:border-cyan-900">
            <button
              onClick={() => setShowLoggedDays(!showLoggedDays)}
              className="mb-2 flex w-full items-center justify-between text-sm font-medium text-zinc-900 transition-colors hover:text-zinc-700 dark:text-zinc-50 dark:hover:text-zinc-300 strawberry:text-rose-900 strawberry:hover:text-rose-700 cherry:text-rose-300 cherry:hover:text-rose-400 seafoam:text-cyan-900 seafoam:hover:text-cyan-700 ocean:text-cyan-300 ocean:hover:text-cyan-400"
            >
              <span>Logged Days ({daysLogged})</span>
              <svg
                className={`h-4 w-4 transition-transform ${showLoggedDays ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showLoggedDays && (
              <div className="flex flex-wrap gap-2">
                {Object.entries(wordsByDate)
                  .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
                  .map(([date, words]) => (
                    <div
                      key={date}
                      className={`rounded-md px-3 py-2 text-sm ${
                        words >= goal.dailyWordTarget
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 cherry:bg-green-900 cherry:text-green-200 ocean:bg-green-900 ocean:text-green-200"
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 cherry:bg-red-900 cherry:text-red-200 ocean:bg-red-900 ocean:text-red-200"
                      }`}
                    >
                      <div className="font-medium">{formatDate(date)}</div>
                      <div className="text-xs opacity-75">{words.toLocaleString()} words</div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

      </div>
    </Card>
  );
}
