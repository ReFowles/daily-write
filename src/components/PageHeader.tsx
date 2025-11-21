"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "./ui/Button";
import { themeClasses } from "@/lib/theme-utils";
import { formatDateRange } from "@/lib/date-utils";
import { cn } from "@/lib/class-utils";

interface PageHeaderProps {
  title: string;
  description: string;
  dailyGoal?: number;
  daysLeft?: number;
  writtenToday?: number;
  goalStartDate?: string;
  goalEndDate?: string;
  showNewGoalButton?: boolean;
  showWriteButton?: boolean;
  onNewGoalClick?: () => void;
  newGoalButtonText?: string;
}

export function PageHeader({
  title,
  description,
  dailyGoal = 0,
  daysLeft = 0,
  writtenToday = 0,
  goalStartDate,
  goalEndDate,
  showNewGoalButton = true,
  showWriteButton = true,
  onNewGoalClick,
  newGoalButtonText = "New Goal",
}: PageHeaderProps) {
  const { data: session } = useSession();
  const dateRangeText = (!goalStartDate || !goalEndDate) 
    ? "No active goal" 
    : formatDateRange(goalStartDate, goalEndDate);

  return (
    <div className="mb-8 flex items-start justify-between gap-6">
      {/* Title and description */}
      <div>
        <h1 className={cn("text-4xl font-bold", themeClasses.text.primary)}>
          {title}
        </h1>
        <p className={cn("mt-2 text-lg", themeClasses.text.secondary)}>
          {description}
        </p>
      </div>

      {/* Stats cards and action buttons - only show when authenticated */}
      {session && (
        <div className="flex flex-wrap items-stretch justify-end gap-3">
        {/* Today Card */}
        <div className={cn("flex flex-col rounded-lg border px-4 py-2 text-center", themeClasses.border.card, themeClasses.background.card)}>
          <div className="text-xs text-zinc-600 dark:text-zinc-400 strawberry:text-rose-700 cherry:text-rose-400 seafoam:text-cyan-700 ocean:text-cyan-400">
            Today
          </div>
          <div className={cn(
            "flex flex-1 items-center justify-center text-2xl font-semibold",
            writtenToday >= dailyGoal
              ? "text-green-700 dark:text-green-400 strawberry:text-green-700 cherry:text-green-400 seafoam:text-green-700 ocean:text-green-400"
              : themeClasses.text.primary
          )}>
            {writtenToday}
          </div>
        </div>

        {/* Today's Goal Card */}
        <div className={cn("flex flex-col rounded-lg border px-4 py-2 text-center", themeClasses.border.card, themeClasses.background.card)}>
          <div className={cn("text-xs", themeClasses.text.secondary)}>
            Goal
          </div>
          <div className={cn("flex flex-1 items-center justify-center text-lg font-semibold", themeClasses.text.primary)}>
            {dailyGoal}
          </div>
        </div>

        {/* Current Goal Period Card */}
        <div className={cn("flex flex-col rounded-lg border px-4 py-2 text-center", themeClasses.border.card, themeClasses.background.card)}>
          <div className={cn("text-xs", themeClasses.text.secondary)}>
            Current
          </div>
          <div className={cn("flex flex-1 items-center justify-center text-lg font-semibold", themeClasses.text.primary)}>
            {dateRangeText}
          </div>
        </div>

        {/* Days Left Card */}
        <div className={cn("flex flex-col rounded-lg border px-4 py-2 text-center", themeClasses.border.card, themeClasses.background.card)}>
          <div className={cn("text-xs", themeClasses.text.secondary)}>
            Days Left
          </div>
          <div className={cn("flex flex-1 items-center justify-center text-lg font-semibold", themeClasses.text.primary)}>
            {daysLeft}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          {showNewGoalButton && (
            <>
              {onNewGoalClick ? (
                <Button variant="secondary" onClick={onNewGoalClick} className="w-full">
                  {newGoalButtonText}
                </Button>
              ) : (
                <Link href="/goals?new=true" className="w-full">
                  <Button variant="secondary" className="w-full">
                    {newGoalButtonText}
                  </Button>
                </Link>
              )}
            </>
          )}
          {showWriteButton && (
            <Link href="/write" className="w-full">
              <Button variant="primary" className="w-full">
                Write
              </Button>
            </Link>
          )}
        </div>
        </div>
      )}
    </div>
  );
}
