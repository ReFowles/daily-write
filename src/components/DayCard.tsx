import { cn } from "@/lib/class-utils";
import { formatDayOfWeek, formatMonthDay } from "@/lib/date-utils";
import { formatWordCount } from "@/lib/format-utils";

interface DayCardProps {
  variant?: "compact" | "expanded";
  date: Date | null;
  wordsWritten: number;
  goal: number | null;
  isToday: boolean;
  isFuture: boolean;
  casual?: boolean;
}

export function DayCard({
  variant = "expanded",
  date,
  wordsWritten,
  goal,
  isToday,
  isFuture,
  casual = false,
}: DayCardProps) {
  if (!date) {
    return <div className={variant === "compact" ? "min-h-12 sm:min-h-15" : ""} />;
  }

  const meetsGoal = goal !== null && wordsWritten >= goal;
  const hasGoal = goal !== null;
  const difference = goal !== null ? wordsWritten - goal : 0;
  const showDifference = !isFuture && hasGoal;
  const isCompact = variant === "compact";

  // A past day below its target. Casual goals treat a zero-word miss as a
  // neutral (gray) day rather than a red "failed" day.
  const isMiss = !isToday && !isFuture && !meetsGoal && hasGoal;
  const casualMiss = isMiss && casual && wordsWritten === 0;
  const redMiss = isMiss && !casualMiss;

  const containerClasses = cn(
    "flex flex-col overflow-hidden transition-all",
    isCompact ? "rounded-md min-h-12 sm:min-h-15" : "rounded-lg",
    isFuture && "border-2 border-dashed border-line opacity-60",
    !isCompact && isToday && "shadow-lg scale-105",
    isToday && meetsGoal && "border-2 border-green-500",
    isToday && !meetsGoal && "border-2 border-line-strong",
    !isToday && !isFuture && meetsGoal && "border-2 border-green-500/30",
    redMiss && "border-2 border-red-500/30",
    casualMiss && "border-2 border-line/50",
    !isToday && !isFuture && !hasGoal && "border-2 border-line/50"
  );

  const headerBackgroundClasses = cn(
    isCompact ? "py-0.5 px-1 sm:py-1 sm:px-2 md:px-4" : "py-1 px-2 sm:py-2 sm:px-4",
    isFuture && "bg-surface-sunken",
    isToday && meetsGoal && "bg-green-500",
    isToday && !meetsGoal && "bg-surface-sunken/50",
    !isToday && !isFuture && meetsGoal && "bg-green-500/70",
    redMiss && "bg-red-500/70",
    casualMiss && "bg-surface-sunken/50",
    !isToday && !isFuture && !hasGoal && "bg-surface-sunken/50"
  );

  const headerTextClasses = cn(
    isCompact ? "text-xs sm:text-sm" : "text-base sm:text-xl",
    "font-semibold",
    isFuture && "text-fg-subtle",
    isToday && "font-bold",
    isToday && meetsGoal && "text-white",
    isToday && !meetsGoal && "text-fg",
    !isToday && !isFuture && meetsGoal && "text-white",
    redMiss && "text-white",
    casualMiss && "text-fg",
    !isToday && !isFuture && !hasGoal && "text-fg"
  );

  const secondaryHeaderTextClasses = cn(
    "text-xs font-semibold",
    isFuture && "text-fg-subtle",
    isToday && "font-bold",
    isToday && meetsGoal && "text-white",
    isToday && !meetsGoal && "text-fg",
    !isToday && !isFuture && meetsGoal && "text-white",
    redMiss && "text-white",
    casualMiss && "text-fg",
    !isToday && !isFuture && !hasGoal && "text-fg"
  );

  const bodyBackgroundClasses = cn(
    (isFuture || isToday) && "bg-transparent",
    !isFuture && !isToday && meetsGoal && "bg-green-500/10",
    redMiss && "bg-red-500/10"
  );

  const wordCountClasses = cn(
    isCompact ? "text-xs sm:text-sm" : "text-lg sm:text-2xl",
    "font-bold",
    isFuture && "font-semibold text-fg-subtle",
    !isFuture && isToday && meetsGoal && "text-green-700",
    !isFuture && isToday && !meetsGoal && "text-fg",
    !isFuture && !isToday && meetsGoal && "text-green-700/70",
    !isFuture && redMiss && "text-red-700/70",
    !isFuture && casualMiss && "text-fg",
    !isFuture && !isToday && !hasGoal && "text-fg"
  );

  const differenceClasses = cn(
    isCompact ? "text-xs" : "text-sm",
    "font-bold",
    meetsGoal && isToday && "text-green-700",
    meetsGoal && !isToday && "text-green-700/70",
    !meetsGoal && isToday && "text-fg",
    !meetsGoal && !isToday && casualMiss && "text-fg-subtle",
    !meetsGoal && !isToday && !casualMiss && "text-red-700/70"
  );

  return (
    <div
      className={containerClasses}
      role="gridcell"
      aria-label={`${date.toLocaleDateString("en-US", { month: "long", day: "numeric" })}${goal ? `, goal: ${formatWordCount(goal)} words` : ""}${!isFuture ? `, written: ${formatWordCount(wordsWritten)} words` : ""}`}
    >
      <div className={headerBackgroundClasses}>
        <div className="text-center">
          {!isCompact && (
            <div className={secondaryHeaderTextClasses}>
              {formatDayOfWeek(date)}
            </div>
          )}
          <div className={headerTextClasses}>
            {isCompact ? date.getDate() : formatMonthDay(date)}
          </div>
        </div>
      </div>

      <div
        className={cn(
          "text-center",
          isCompact
            ? "flex-1 flex flex-col justify-end items-center p-1 sm:p-1.5 space-y-0"
            : "py-2 px-2 sm:py-4 sm:px-4",
          bodyBackgroundClasses
        )}
      >
        <div className={wordCountClasses}>
          {isFuture && hasGoal ? (
            <span
              className={cn(
                "text-fg-subtle",
                isCompact ? "text-xs" : "text-sm sm:text-lg"
              )}
            >
              / {formatWordCount(goal)}
            </span>
          ) : !isFuture && hasGoal ? (
            <>
              {formatWordCount(wordsWritten)}{" "}
              <span
                className={cn(
                  "text-fg-subtle",
                  isCompact ? "text-xs" : "text-sm sm:text-lg"
                )}
              >
                / {formatWordCount(goal)}
              </span>
            </>
          ) : (
            formatWordCount(wordsWritten)
          )}
        </div>
        {showDifference && difference !== 0 && (
          <div className={cn("mt-1", differenceClasses)}>
            {difference > 0 ? "+" : ""}
            {formatWordCount(difference)}
          </div>
        )}
      </div>
    </div>
  );
}

export default DayCard;
