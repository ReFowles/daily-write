"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "./ui/Button";
import { themeClasses } from "@/lib/theme-utils";
import { formatDateRange } from "@/lib/date-utils";
import { cn } from "@/lib/class-utils";

interface PageHeaderProps {
  title: string;
  description: ReactNode;
  dailyGoal?: number;
  daysLeft?: number;
  writtenToday?: number;
  goalStartDate?: string;
  goalEndDate?: string;
  showNewGoalButton?: boolean;
  showWriteButton?: boolean;
  onNewGoalClick?: () => void;
  newGoalButtonText?: string;
  hideStats?: boolean;
}

interface HeaderStat {
  label: string;
  value: ReactNode;
  valueClassName?: string;
  emphasize?: boolean;
}

function HeaderStatCard({ label, value, valueClassName, emphasize }: HeaderStat) {
  return (
    <div className={cn("flex flex-col rounded-lg border px-4 py-2 text-center", themeClasses.border.card, themeClasses.background.card)}>
      <div className={cn("text-xs", themeClasses.text.secondary)}>{label}</div>
      <div
        className={cn(
          "flex flex-1 items-center justify-center font-semibold",
          emphasize ? "text-2xl" : "text-lg",
          valueClassName ?? themeClasses.text.primary
        )}
      >
        {value}
      </div>
    </div>
  );
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
  hideStats = false,
}: PageHeaderProps) {
  const { data: session } = useSession();
  const dateRangeText = (!goalStartDate || !goalEndDate)
    ? "No active goal"
    : formatDateRange(goalStartDate, goalEndDate);

  const todayHitGoal = writtenToday >= dailyGoal;
  const stats: HeaderStat[] = [
    {
      label: "Today",
      value: writtenToday,
      emphasize: true,
      valueClassName: todayHitGoal
        ? "text-green-700 dark:text-green-400 strawberry:text-green-700 cherry:text-green-400 seafoam:text-green-700 ocean:text-green-400"
        : undefined,
    },
    { label: "Goal", value: dailyGoal },
    { label: "Current", value: dateRangeText },
    { label: "Days Left", value: daysLeft },
  ];

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
      {session && (!hideStats || showNewGoalButton || showWriteButton) && (
        <div className="flex flex-wrap items-stretch justify-end gap-3">
          {!hideStats && stats.map((stat) => (
            <HeaderStatCard key={stat.label} {...stat} />
          ))}

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            {showNewGoalButton && (
              onNewGoalClick ? (
                <Button variant="secondary" onClick={onNewGoalClick} className="w-full">
                  {newGoalButtonText}
                </Button>
              ) : (
                <Link href="/goals?new=true" className="w-full">
                  <Button variant="secondary" className="w-full">
                    {newGoalButtonText}
                  </Button>
                </Link>
              )
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
