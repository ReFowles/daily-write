"use client";

import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/Button";
import { LuChevronDown, LuTrash2 } from "react-icons/lu";
import { useToggle } from "@/lib/use-toggle";
import { themeClasses } from "@/lib/theme-utils";
import { cn } from "@/lib/class-utils";
import { formatWordCount, pluralizeUnit } from "@/lib/format-utils";
import type { Goal, WritingSession } from "@/lib/types";
import {
  formatDate,
  getEffectiveTotalTarget,
  parseLocalDate,
  toDateString,
} from "@/lib/date-utils";

interface GoalCardProps {
  goal: Goal;
  writingSessions: WritingSession[];
  onDelete: (goalId: string) => void;
}

export function GoalCard({ goal, writingSessions, onDelete }: GoalCardProps) {
  const { isOpen: showLoggedDays, toggle: toggleLoggedDays } = useToggle(false);

  // Manual goals track a hand-updated unit counter instead of daily words, so
  // they get their own simpler card body.
  if (goal.kind === "manual") {
    return <ManualGoalCardBody goal={goal} onDelete={onDelete} />;
  }

  // Calculate stats
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const startDate = parseLocalDate(goal.startDate);
  const endDate = parseLocalDate(goal.endDate);
  const isCompleted = endDate < now;

  const totalDays =
    Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const excludedSet = new Set(goal.excludedDays ?? []);
  const cheatSet = new Set(goal.cheatDaysUsed ?? []);

  // Filter writing sessions that fall within this goal's date range
  const goalSessions = writingSessions.filter((session) => {
    const sessionDate = parseLocalDate(session.date);
    return sessionDate >= startDate && sessionDate <= endDate;
  });

  // Build a per-day word count map that includes every prior day within the
  // goal window — including days with 0 words — so users can see the full
  // history at a glance. Upcoming goals get an empty list.
  const wordsByDate: Record<string, number> = {};
  goalSessions.forEach((session) => {
    wordsByDate[session.date] = session.wordCount;
  });

  const lastVisibleDay = endDate < now ? endDate : now;
  if (startDate <= lastVisibleDay) {
    for (
      let cursor = new Date(startDate);
      cursor.getTime() <= lastVisibleDay.getTime();
      cursor.setDate(cursor.getDate() + 1)
    ) {
      const key = toDateString(cursor);
      if (!(key in wordsByDate)) wordsByDate[key] = 0;
    }
  }

  // Cheat days never appear; rest days appear only if the writer wrote anyway.
  const visibleDays = Object.entries(wordsByDate)
    .filter(([date, words]) => {
      if (cheatSet.has(date)) return false;
      if (excludedSet.has(date) && words === 0) return false;
      return true;
    })
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB));

  const displayedDayCount = visibleDays.length;
  // Cheat-day words don't count toward the total.
  const totalWordsWritten = goalSessions.reduce(
    (sum, session) => (cheatSet.has(session.date) ? sum : sum + session.wordCount),
    0
  );
  const targetTotalWords = getEffectiveTotalTarget(goal);
  const progress = Math.min((totalWordsWritten / targetTotalWords) * 100, 100);

  // For average calculation: use total days if goal is completed or past, otherwise use elapsed days (excluding today)
  const goalIsInPast = endDate < now;
  const elapsedDays = goalIsInPast
    ? totalDays
    : Math.max(1, Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
  // Rest and cheat days aren't writing days, so they don't dilute the average.
  const nonWritingElapsed = [...excludedSet, ...cheatSet].filter((date) => {
    const d = parseLocalDate(date);
    return d >= startDate && d <= lastVisibleDay;
  }).length;
  const elapsedWritingDays = Math.max(1, elapsedDays - nonWritingElapsed);
  const averageWordsPerDay =
    goalSessions.length > 0 ? Math.round(totalWordsWritten / elapsedWritingDays) : 0;

  return (
    <Card className={`p-6 ${isCompleted ? "opacity-75" : ""}`}>
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h3 className={cn("text-xl font-semibold", themeClasses.text.primary)}>
                {formatDate(goal.startDate)} - {formatDate(goal.endDate)}
              </h3>
              {isCompleted && (
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    progress >= 100
                      ? "bg-green-500/15 text-green-700 dark:text-green-300"
                      : "bg-red-500/15 text-red-700 dark:text-red-300"
                  }`}
                >
                  {progress >= 100 ? "Goal Met ✓" : "Goal Not Met"}
                </span>
              )}
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-medium uppercase tracking-wide",
                  "bg-accent-subtle text-accent-subtle-fg"
                )}
                aria-label={`${goal.mode === "live" ? "Live" : "Static"} goal`}
              >
                {goal.mode === "live" ? "Live" : "Static"}
              </span>
            </div>
            <p className={cn("mt-1 text-sm", themeClasses.text.secondary)}>
              {formatWordCount(goal.dailyWordTarget)} {pluralizeUnit("word", goal.dailyWordTarget)}
              /day for {totalDays} days
              {" • "}
              {formatWordCount(goal.totalWordTarget)} total
              {excludedSet.size > 0 &&
                ` • ${excludedSet.size} rest day${excludedSet.size === 1 ? "" : "s"}`}
              {(goal.cheatDaysAllowed ?? 0) > 0 &&
                ` • ${cheatSet.size}/${goal.cheatDaysAllowed} cheat days`}
            </p>
          </div>
          <Button
            variant="icon"
            onClick={() => onDelete(goal.id)}
            className="text-fg-subtle transition-colors hover:text-red-600 dark:hover:text-red-400"
            aria-label="Delete goal"
          >
            <LuTrash2 className="h-5 w-5" />
          </Button>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className={cn("font-medium", themeClasses.text.primary)}>
              {formatWordCount(totalWordsWritten)} / {formatWordCount(targetTotalWords)}{" "}
              {pluralizeUnit("word", targetTotalWords)} • Avg: {formatWordCount(averageWordsPerDay)}{" "}
              {pluralizeUnit("word", averageWordsPerDay)}/day
            </span>
            <span className={themeClasses.text.secondary}>{Math.round(progress)}%</span>
          </div>
          <ProgressBar value={progress} size="md" isCompleted={isCompleted} />
        </div>

        {/* Logged Days */}
        {displayedDayCount > 0 && (
          <div className={cn("border-t pt-4", themeClasses.border.divider)}>
            <button
              onClick={toggleLoggedDays}
              className={cn(
                "mb-2 flex w-full items-center justify-between text-sm font-medium transition-colors",
                themeClasses.text.primary,
                "hover:opacity-70"
              )}
            >
              <span>Logged Days ({displayedDayCount})</span>
              <LuChevronDown
                className={cn("h-3 w-3 transition-transform", showLoggedDays && "rotate-180")}
              />
            </button>
            {showLoggedDays && (
              <div className="flex flex-wrap gap-2">
                {visibleDays.map(([date, words]) => {
                  const meetsGoal = words >= goal.dailyWordTarget;
                  const isExcluded = excludedSet.has(date);
                  const neutralMiss = !meetsGoal && ((goal.casual && words === 0) || isExcluded);
                  return (
                    <div
                      key={date}
                      className={`rounded-md px-3 py-2 text-sm ${
                        meetsGoal
                          ? "bg-green-500/15 text-green-700 dark:text-green-300"
                          : neutralMiss
                            ? cn("bg-surface-sunken", themeClasses.text.secondary)
                            : "bg-red-500/15 text-red-700 dark:text-red-300"
                      }`}
                    >
                      <div className="font-medium">{formatDate(date)}</div>
                      <div className="text-xs opacity-75">
                        {formatWordCount(words)} {pluralizeUnit("word", words)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

interface ManualGoalCardBodyProps {
  goal: Goal;
  onDelete: (goalId: string) => void;
}

function ManualGoalCardBody({ goal, onDelete }: ManualGoalCardBodyProps) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const startDate = parseLocalDate(goal.startDate);
  const endDate = parseLocalDate(goal.endDate);
  const isCompleted = endDate < now;

  const totalDays =
    Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const label = goal.unitLabel ?? "unit";
  const total = goal.totalWordTarget;
  const completed = Math.min(goal.completedUnits ?? 0, total);
  const daily = goal.dailyWordTarget;
  const progress = total > 0 ? Math.min((completed / total) * 100, 100) : 0;
  const goalMet = completed >= total;

  return (
    <Card className={`p-6 ${isCompleted ? "opacity-75" : ""}`}>
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h3 className={cn("text-xl font-semibold", themeClasses.text.primary)}>
                {formatDate(goal.startDate)} - {formatDate(goal.endDate)}
              </h3>
              {isCompleted && (
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    goalMet
                      ? "bg-green-500/15 text-green-700 dark:text-green-300"
                      : "bg-red-500/15 text-red-700 dark:text-red-300"
                  }`}
                >
                  {goalMet ? "Goal Met ✓" : "Goal Not Met"}
                </span>
              )}
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-medium uppercase tracking-wide",
                  "bg-accent-subtle text-accent-subtle-fg"
                )}
                aria-label="Manual goal"
              >
                Manual
              </span>
            </div>
            <p className={cn("mt-1 text-sm", themeClasses.text.secondary)}>
              {formatWordCount(daily)} {pluralizeUnit(label, daily)}/day for {totalDays} days
              {" • "}
              {formatWordCount(total)} {pluralizeUnit(label, total)} total
            </p>
          </div>
          <Button
            variant="icon"
            onClick={() => onDelete(goal.id)}
            className="text-fg-subtle transition-colors hover:text-red-600 dark:hover:text-red-400"
            aria-label="Delete goal"
          >
            <LuTrash2 className="h-5 w-5" />
          </Button>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className={cn("font-medium", themeClasses.text.primary)}>
              {formatWordCount(completed)} / {formatWordCount(total)} {pluralizeUnit(label, total)}
            </span>
            <span className={themeClasses.text.secondary}>{Math.round(progress)}%</span>
          </div>
          <ProgressBar value={progress} size="md" isCompleted={isCompleted} />
        </div>
      </div>
    </Card>
  );
}
