"use client";

import type { ReactNode } from "react";
import { useSession } from "next-auth/react";
import { themeClasses } from "@/lib/theme-utils";
import { formatDateRange } from "@/lib/date-utils";
import { formatWordCount } from "@/lib/format-utils";
import { cn } from "@/lib/class-utils";

interface PageHeaderProps {
  title: string;
  description: ReactNode;
  dailyGoal?: number;
  daysLeft?: number;
  writtenToday?: number;
  goalStartDate?: string;
  goalEndDate?: string;
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
    <div
      className={cn(
        "flex flex-col rounded-lg border px-3 py-1.5 text-center sm:px-4 sm:py-2",
        themeClasses.border.card,
        themeClasses.background.card
      )}
    >
      <div className={cn("text-[0.65rem] sm:text-xs", themeClasses.text.secondary)}>
        {label}
      </div>
      <div
        className={cn(
          "flex flex-1 items-center justify-center font-semibold",
          emphasize ? "text-lg sm:text-2xl" : "text-sm sm:text-lg",
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
      value: formatWordCount(writtenToday),
      emphasize: true,
      valueClassName: todayHitGoal
        ? "text-green-700 dark:text-green-400 strawberry:text-green-700 cherry:text-green-400 seafoam:text-green-700 ocean:text-green-400"
        : undefined,
    },
    { label: "Goal", value: formatWordCount(dailyGoal) },
    { label: "Current", value: dateRangeText },
    { label: "Days Left", value: daysLeft },
  ];

  // A plain-string description is hidden in the sm range so stat cards can
  // float on the right without wrapping; ReactNode descriptions (e.g. those
  // containing a button) are kept.
  const hideDescriptionOnTablet = typeof description === "string";

  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      {/* Title and description */}
      <div className="order-2 min-w-0 sm:order-1">
        <h1
          className={cn(
            "text-2xl font-bold sm:text-4xl",
            themeClasses.text.primary
          )}
        >
          {title}
        </h1>
        <div
          className={cn(
            "mt-1 text-base sm:mt-2 sm:text-lg",
            themeClasses.text.secondary,
            hideDescriptionOnTablet && "sm:hidden md:block"
          )}
        >
          {description}
        </div>
      </div>

      {session && !hideStats && (
        // Current (3rd) column takes its 1fr share when there's room but is
        // allowed to expand to max-content when needed so its date range never
        // wraps; the other three share whatever's left equally and can shrink.
        <div
          className={cn(
            "order-1 grid gap-2",
            "grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(max-content,1fr)_minmax(0,1fr)]",
            "sm:order-2 sm:flex sm:w-auto sm:flex-wrap sm:items-stretch sm:justify-end sm:gap-3"
          )}
        >
          {stats.map((stat) => (
            <HeaderStatCard key={stat.label} {...stat} />
          ))}
        </div>
      )}
    </div>
  );
}
