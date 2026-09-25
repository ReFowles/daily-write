"use client";

import type { ReactNode } from "react";
import { useSession } from "next-auth/react";
import { LuMinus, LuPlus } from "react-icons/lu";
import { themeClasses } from "@/lib/theme-utils";
import { formatDateRange } from "@/lib/date-utils";
import { formatWordCount, pluralizeUnit } from "@/lib/format-utils";
import { cn } from "@/lib/class-utils";
import type { ManualHeaderInfo } from "@/lib/use-current-goal";

interface PageHeaderProps {
  title: string;
  description: ReactNode;
  dailyGoal?: number;
  daysLeft?: number;
  writtenToday?: number;
  goalStartDate?: string;
  goalEndDate?: string;
  hideStats?: boolean;
  // When set, the active goal is a manual one: the header swaps its word stats
  // for a completion counter with +/- controls.
  manualGoal?: ManualHeaderInfo;
  /**
   * When true, goal-derived stat values render as `…` so the header doesn't
   * flash zeros before the current-goal fetch resolves.
   */
  isLoading?: boolean;
}

const LOADING_PLACEHOLDER = "\u2026";

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
      <div className={cn("text-[0.65rem] sm:text-xs", themeClasses.text.secondary)}>{label}</div>
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

// The header's manual-goal card: a completion counter with +/- controls docked
// at the bottom, sized to sit alongside the other small stat cards.
function ManualCounterCard({ manualGoal }: { manualGoal: ManualHeaderInfo }) {
  const { label, completed, total, dailyTarget, onIncrement, onDecrement } = manualGoal;
  const isComplete = total > 0 && completed >= total;

  return (
    <div
      className={cn(
        "flex flex-col rounded-lg border px-3 py-1.5 text-center sm:px-4 sm:py-2",
        themeClasses.border.card,
        themeClasses.background.card
      )}
    >
      <div className={cn("text-[0.65rem] capitalize sm:text-xs", themeClasses.text.secondary)}>
        {pluralizeUnit(label, dailyTarget)}
      </div>
      <div
        className={cn(
          "flex flex-1 items-center justify-center text-lg font-semibold sm:text-2xl",
          isComplete ? "text-green-700 dark:text-green-400" : themeClasses.text.primary
        )}
      >
        {formatWordCount(completed)}
        <span className={cn("ml-1 text-sm sm:text-lg", themeClasses.text.secondary)}>
          / {formatWordCount(dailyTarget)}
        </span>
      </div>
      <div className="mt-1 flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={onDecrement}
          disabled={completed <= 0}
          aria-label={`Decrease ${label || "unit"} count`}
          className={cn(
            "inline-flex h-6 w-6 items-center justify-center rounded-full border transition-colors",
            themeClasses.border.card,
            "hover:bg-surface-sunken disabled:cursor-not-allowed disabled:opacity-40"
          )}
        >
          <LuMinus className="h-3.5 w-3.5" aria-hidden />
        </button>
        <button
          type="button"
          onClick={onIncrement}
          disabled={total > 0 && completed >= total}
          aria-label={`Increase ${label || "unit"} count`}
          className={cn(
            "inline-flex h-6 w-6 items-center justify-center rounded-full border transition-colors",
            themeClasses.border.card,
            "hover:bg-surface-sunken disabled:cursor-not-allowed disabled:opacity-40"
          )}
        >
          <LuPlus className="h-3.5 w-3.5" aria-hidden />
        </button>
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
  manualGoal,
  isLoading = false,
}: PageHeaderProps) {
  const { data: session } = useSession();
  const dateRangeText =
    !goalStartDate || !goalEndDate ? "No active goal" : formatDateRange(goalStartDate, goalEndDate);

  const todayHitGoal = !isLoading && writtenToday >= dailyGoal;
  const stats: HeaderStat[] = [
    {
      label: "Today",
      value: formatWordCount(writtenToday),
      emphasize: true,
      valueClassName: todayHitGoal ? "text-green-700 dark:text-green-400" : undefined,
    },
    { label: "Goal", value: isLoading ? LOADING_PLACEHOLDER : formatWordCount(dailyGoal) },
    { label: "Current", value: isLoading ? LOADING_PLACEHOLDER : dateRangeText },
    { label: "Days Left", value: isLoading ? LOADING_PLACEHOLDER : daysLeft },
  ];

  // Manual goals swap the word-count cards for the goal's total unit target;
  // the completion counter itself is rendered separately with its +/- controls.
  const manualStats: HeaderStat[] = manualGoal
    ? [
        {
          label: "Total",
          value: isLoading
            ? LOADING_PLACEHOLDER
            : `${formatWordCount(manualGoal.total)} ${pluralizeUnit(manualGoal.label, manualGoal.total)}`,
        },
        { label: "Current", value: isLoading ? LOADING_PLACEHOLDER : dateRangeText },
        { label: "Days Left", value: isLoading ? LOADING_PLACEHOLDER : daysLeft },
      ]
    : [];

  // A plain-string description is hidden in the sm range so stat cards can
  // float on the right without wrapping; ReactNode descriptions (e.g. those
  // containing a button) are kept.
  const hideDescriptionOnTablet = typeof description === "string";

  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      {/* Title and description */}
      <div className="order-2 min-w-0 sm:order-1">
        <h1 className={cn("text-2xl font-bold sm:text-4xl", themeClasses.text.primary)}>{title}</h1>
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
          {manualGoal ? (
            <>
              <ManualCounterCard manualGoal={manualGoal} />
              {manualStats.map((stat) => (
                <HeaderStatCard key={stat.label} {...stat} />
              ))}
            </>
          ) : (
            stats.map((stat) => <HeaderStatCard key={stat.label} {...stat} />)
          )}
        </div>
      )}
    </div>
  );
}
