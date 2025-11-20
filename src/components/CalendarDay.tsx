import { cn } from "@/lib/class-utils";

interface CalendarDayProps {
  date: Date | null;
  wordsWritten: number;
  goal: number | null;
  isToday: boolean;
  isFuture: boolean;
}

export function CalendarDay({
  date,
  wordsWritten,
  goal,
  isToday,
  isFuture,
}: CalendarDayProps) {
  // Empty cell for padding days
  if (!date) {
    return <div className="min-h-[60px]" />;
  }

  const meetsGoal = goal !== null && wordsWritten >= goal;
  const hasGoal = goal !== null;
  const difference = goal !== null ? wordsWritten - goal : 0;
  const showDifference = !isFuture && hasGoal;

  // Word count styling
  const wordCountClasses = cn(
    "text-sm font-medium",
    isFuture && "text-zinc-400 dark:text-zinc-600 strawberry:text-rose-400 cherry:text-rose-700 seafoam:text-cyan-400 ocean:text-cyan-700",
    !isFuture && !hasGoal && "font-semibold text-zinc-600 dark:text-zinc-400 strawberry:text-rose-700 cherry:text-rose-400 seafoam:text-cyan-700 ocean:text-cyan-400",
    !isFuture && hasGoal && meetsGoal && "font-semibold text-green-600 dark:text-green-400 cherry:text-green-400 ocean:text-green-400",
    !isFuture && hasGoal && !meetsGoal && "font-semibold text-red-600 dark:text-red-400 cherry:text-red-400 ocean:text-red-400"
  );

  // Difference text styling
  const differenceClasses = cn(
    "text-xs font-medium",
    meetsGoal ? "text-green-600 dark:text-green-500 cherry:text-green-500 ocean:text-green-500" : "text-red-600 dark:text-red-500 cherry:text-red-500 ocean:text-red-500"
  );

  // Header background styling
  const headerClasses = cn(
    "py-1 px-1.5",
    isFuture && "bg-zinc-200 dark:bg-zinc-800 strawberry:bg-rose-200 cherry:bg-rose-900 seafoam:bg-cyan-200 ocean:bg-cyan-900",
    isToday && meetsGoal && "bg-green-500 dark:bg-green-700 cherry:bg-green-700 ocean:bg-green-700",
    isToday && !meetsGoal && "bg-zinc-200/50 dark:bg-zinc-800/50 strawberry:bg-rose-200/50 cherry:bg-rose-900/50 seafoam:bg-cyan-200/50 ocean:bg-cyan-900/50",
    !isToday && !isFuture && meetsGoal && "bg-green-500/70 dark:bg-green-700/70 cherry:bg-green-700/70 ocean:bg-green-700/70",
    !isToday && !isFuture && !meetsGoal && hasGoal && "bg-red-500/70 dark:bg-red-700/70 cherry:bg-red-700/70 ocean:bg-red-700/70"
  );

  // Header text styling
  const headerTextClasses = cn(
    "text-sm",
    isFuture && "font-semibold text-zinc-500 dark:text-zinc-400 strawberry:text-rose-600 cherry:text-rose-500 seafoam:text-cyan-600 ocean:text-cyan-500",
    isToday && "font-bold",
    isToday && meetsGoal && "text-white",
    isToday && !meetsGoal && "text-zinc-900 dark:text-zinc-100 strawberry:text-rose-900 cherry:text-rose-300 seafoam:text-cyan-900 ocean:text-cyan-300",
    !isToday && !isFuture && "font-semibold text-white"
  );

  // Goal header text styling
  const goalHeaderTextClasses = cn(
    "text-xs font-normal",
    isFuture && "text-zinc-500 dark:text-zinc-400 strawberry:text-rose-600 cherry:text-rose-500 seafoam:text-cyan-600 ocean:text-cyan-500",
    isToday && meetsGoal && "text-white",
    isToday && !meetsGoal && "text-zinc-900 dark:text-zinc-100 strawberry:text-rose-900 cherry:text-rose-300 seafoam:text-cyan-900 ocean:text-cyan-300",
    !isToday && !isFuture && "text-white"
  );

  // Body background styling
  const bodyBackgroundClasses = cn(
    (isFuture || isToday) && "bg-transparent",
    !isFuture && !isToday && meetsGoal && "bg-green-500/10 dark:bg-green-700/10 cherry:bg-green-700/10 ocean:bg-green-700/10",
    !isFuture && !isToday && !meetsGoal && hasGoal && "bg-red-500/10 dark:bg-red-700/10 cherry:bg-red-700/10 ocean:bg-red-700/10"
  );

  // Border styling
  const borderClasses = cn(
    isToday ? "border-2 border-blue-500 dark:border-blue-400 strawberry:border-blue-500 cherry:border-blue-400 seafoam:border-blue-500 ocean:border-blue-400 shadow-md" : "border border-zinc-200 dark:border-zinc-800 strawberry:border-rose-200 cherry:border-rose-900 seafoam:border-cyan-200 ocean:border-cyan-900"
  );

  return (
    <div
      className={cn(
        "relative min-h-[60px] rounded-md transition-all overflow-hidden flex flex-col",
        "bg-white dark:bg-zinc-900 strawberry:bg-pink-50/30 cherry:bg-zinc-900/30 seafoam:bg-cyan-50/30 ocean:bg-zinc-900/30",
        borderClasses,
        "hover:shadow-sm"
      )}
      role="gridcell"
      aria-label={`${date.toLocaleDateString("en-US", { month: "long", day: "numeric" })}${goal ? `, goal: ${goal} words` : ""}${!isFuture ? `, written: ${wordsWritten} words` : ""}`}
    >
      {/* Date Header */}
      <div className={headerClasses}>
        <div className="flex items-center justify-between">
          <span className={headerTextClasses}>{date.getDate()}</span>
          {goal !== null && <span className={goalHeaderTextClasses}>/ {goal}</span>}
        </div>
      </div>

      {/* Content Area */}
      <div className={cn("flex-1 flex flex-col justify-end items-center p-1.5 space-y-0", bodyBackgroundClasses)}>
        {/* Word Count */}
        {!isFuture && (
          <div className={wordCountClasses}>{wordsWritten}</div>
        )}

        {/* Difference */}
        {showDifference && (
          <div className={differenceClasses}>
            {difference > 0 ? `+${difference}` : difference}
          </div>
        )}
      </div>
    </div>
  );
}

export default CalendarDay;
