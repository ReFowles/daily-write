import { cn } from "@/lib/class-utils";
import { formatDayOfWeek, formatMonthDay } from "@/lib/date-utils";

interface DayCardProps {
  variant?: "compact" | "expanded";
  date: Date | null;
  wordsWritten: number;
  goal: number | null;
  isToday: boolean;
  isFuture: boolean;
}

export function DayCard({ 
  variant = "expanded",
  date, 
  wordsWritten, 
  goal, 
  isToday, 
  isFuture 
}: DayCardProps) {
  // Empty cell for padding days (compact variant only)
  if (!date) {
    return <div className={variant === "compact" ? "min-h-[60px]" : ""} />;
  }

  const meetsGoal = goal !== null && wordsWritten >= goal;
  const hasGoal = goal !== null;
  const difference = goal !== null ? wordsWritten - goal : 0;
  const showDifference = !isFuture && hasGoal;

  // Shared styling logic - using expanded variant as source of truth
  const isCompact = variant === "compact";

  // Container styling - unified border and background logic
  const containerClasses = cn(
    "flex flex-col overflow-hidden transition-all",
    isCompact ? "rounded-md min-h-[60px]" : "rounded-lg",
    // Unified border styling (from expanded)
    isFuture && "border-2 border-dashed border-zinc-300 dark:border-zinc-700 strawberry:border-rose-300 cherry:border-rose-800 seafoam:border-cyan-300 ocean:border-cyan-800 opacity-60",
    !isCompact && isToday && "shadow-lg scale-105",
    isToday && meetsGoal && "border-2 border-green-500 dark:border-green-700 cherry:border-green-700 ocean:border-green-700",
    isToday && !meetsGoal && "border-2 border-zinc-400 dark:border-zinc-600 strawberry:border-rose-400 cherry:border-rose-600 seafoam:border-cyan-400 ocean:border-cyan-600",
    !isToday && !isFuture && meetsGoal && "border-2 border-green-500/30 dark:border-green-700/30 cherry:border-green-700/30 ocean:border-green-700/30",
    !isToday && !isFuture && !meetsGoal && hasGoal && "border-2 border-red-500/30 dark:border-red-700/30 cherry:border-red-700/30 ocean:border-red-700/30",
    !isToday && !isFuture && !hasGoal && "border-2 border-zinc-300/50 dark:border-zinc-700/50 strawberry:border-rose-300/50 cherry:border-rose-800/50 seafoam:border-cyan-300/50 ocean:border-cyan-800/50"
  );

  // Header background styling - unified (from expanded)
  const headerBackgroundClasses = cn(
    isCompact ? "py-1 px-4" : "py-2 px-4",
    isFuture && "bg-zinc-200 dark:bg-zinc-800 strawberry:bg-rose-200 cherry:bg-rose-900 seafoam:bg-cyan-200 ocean:bg-cyan-900",
    isToday && meetsGoal && "bg-green-500 dark:bg-green-700 cherry:bg-green-700 ocean:bg-green-700",
    isToday && !meetsGoal && "bg-zinc-200/50 dark:bg-zinc-800/50 strawberry:bg-rose-200/50 cherry:bg-rose-900/50 seafoam:bg-cyan-200/50 ocean:bg-cyan-900/50",
    !isToday && !isFuture && meetsGoal && "bg-green-500/70 dark:bg-green-700/70 cherry:bg-green-700/70 ocean:bg-green-700/70",
    !isToday && !isFuture && !meetsGoal && hasGoal && "bg-red-500/70 dark:bg-red-700/70 cherry:bg-red-700/70 ocean:bg-red-700/70",
    !isToday && !isFuture && !hasGoal && "bg-zinc-200/50 dark:bg-zinc-800/50 strawberry:bg-rose-200/50 cherry:bg-rose-900/50 seafoam:bg-cyan-200/50 ocean:bg-cyan-900/50"
  );

  // Header text styling - unified (from expanded)
  const headerTextClasses = cn(
    isCompact ? "text-sm" : "text-xl",
    "font-semibold",
    isFuture && "text-zinc-500 dark:text-zinc-400 strawberry:text-rose-600 cherry:text-rose-500 seafoam:text-cyan-600 ocean:text-cyan-500",
    isToday && "font-bold",
    isToday && meetsGoal && "text-white",
    isToday && !meetsGoal && "text-zinc-900 dark:text-zinc-100 strawberry:text-rose-900 cherry:text-rose-300 seafoam:text-cyan-900 ocean:text-cyan-300",
    !isToday && !isFuture && "text-white"
  );

  // Secondary header text styling
  const secondaryHeaderTextClasses = cn(
    "text-xs font-semibold",
    isFuture && "text-zinc-500 dark:text-zinc-400 strawberry:text-rose-600 cherry:text-rose-500 seafoam:text-cyan-600 ocean:text-cyan-500",
    isToday && "font-bold",
    isToday && meetsGoal && "text-white",
    isToday && !meetsGoal && "text-zinc-900 dark:text-zinc-100 strawberry:text-rose-900 cherry:text-rose-300 seafoam:text-cyan-900 ocean:text-cyan-300",
    !isToday && !isFuture && "text-white"
  );

  // Body background styling - unified (from expanded)
  const bodyBackgroundClasses = cn(
    (isFuture || isToday) && "bg-transparent",
    !isFuture && !isToday && meetsGoal && "bg-green-500/10 dark:bg-green-700/10 cherry:bg-green-700/10 ocean:bg-green-700/10",
    !isFuture && !isToday && !meetsGoal && hasGoal && "bg-red-500/10 dark:bg-red-700/10 cherry:bg-red-700/10 ocean:bg-red-700/10"
  );

  // Word count text styling - unified (from expanded)
  const wordCountClasses = cn(
    isCompact ? "text-sm" : "text-2xl",
    "font-bold",
    isFuture && "font-semibold text-zinc-500 dark:text-zinc-400 strawberry:text-rose-600 cherry:text-rose-500 seafoam:text-cyan-600 ocean:text-cyan-500",
    !isFuture && isToday && meetsGoal && "text-green-700 dark:text-green-400 cherry:text-green-400 ocean:text-green-400",
    !isFuture && isToday && !meetsGoal && "text-zinc-900 dark:text-zinc-100 strawberry:text-rose-900 cherry:text-rose-300 seafoam:text-cyan-900 ocean:text-cyan-300",
    !isFuture && !isToday && meetsGoal && "text-green-700/70 dark:text-green-400/70 cherry:text-green-400/70 ocean:text-green-400/70",
    !isFuture && !isToday && !meetsGoal && hasGoal && "text-red-700/70 dark:text-red-400/70 cherry:text-red-400/70 ocean:text-red-400/70",
    !isFuture && !isToday && !hasGoal && "text-zinc-900 dark:text-zinc-100 strawberry:text-rose-900 cherry:text-rose-300 seafoam:text-cyan-900 ocean:text-cyan-300"
  );

  // Difference text styling - unified (from expanded)
  const differenceClasses = cn(
    isCompact ? "text-xs" : "text-sm",
    "font-bold",
    meetsGoal && isToday && "text-green-700 dark:text-green-400 cherry:text-green-400 ocean:text-green-400",
    meetsGoal && !isToday && "text-green-700/70 dark:text-green-400/70 cherry:text-green-400/70 ocean:text-green-400/70",
    !meetsGoal && isToday && "text-zinc-900 dark:text-zinc-100 strawberry:text-rose-900 cherry:text-rose-300 seafoam:text-cyan-900 ocean:text-cyan-300",
    !meetsGoal && !isToday && "text-red-700/70 dark:text-red-400/70 cherry:text-red-400/70 ocean:text-red-400/70"
  );

  return (
    <div
      className={containerClasses}
      role="gridcell"
      aria-label={`${date.toLocaleDateString("en-US", { month: "long", day: "numeric" })}${goal ? `, goal: ${goal} words` : ""}${!isFuture ? `, written: ${wordsWritten} words` : ""}`}
    >
      {/* Date Header */}
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

      {/* Word Count Body */}
      <div 
        className={cn(
          "text-center",
          isCompact ? "flex-1 flex flex-col justify-end items-center p-1.5 space-y-0" : "py-4 px-4",
          bodyBackgroundClasses
        )}
      >
        <div className={wordCountClasses}>
          {isFuture && hasGoal ? (
            <>
              <span className={cn(
                "text-zinc-500 dark:text-zinc-400 strawberry:text-rose-600 cherry:text-rose-500 seafoam:text-cyan-600 ocean:text-cyan-500",
                isCompact ? "text-xs" : "text-lg"
              )}>
                / {goal}
              </span>
            </>
          ) : !isFuture && hasGoal ? (
            <>
              {wordsWritten}{" "}
              <span className={cn(
                "text-zinc-500 dark:text-zinc-400 strawberry:text-rose-600 cherry:text-rose-500 seafoam:text-cyan-600 ocean:text-cyan-500",
                isCompact ? "text-xs" : "text-lg"
              )}>
                / {goal}
              </span>
            </>
          ) : (
            wordsWritten
          )}
        </div>
        {showDifference && difference !== 0 && (
          <div className={cn("mt-1", differenceClasses)}>
            {difference > 0 ? '+' : ''}{difference}
          </div>
        )}
      </div>
    </div>
  );
}

export default DayCard;
