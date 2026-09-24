import { LuSnowflake } from "react-icons/lu";
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
  // A planned rest day: renders gray when below the goal instead of red.
  excludedDay?: boolean;
  // A spent cheat day: renders gray and never counts, regardless of words.
  cheatDay?: boolean;
  // Whether the cheat-day toggle should be offered on this cell.
  canToggleCheat?: boolean;
  onToggleCheat?: () => void;
}

// Visual tone for a day cell. Excluded/cheat days collapse to "neutral" (gray)
// so a planned or forgiven miss never reads as a red failure.
type DayTone = "future" | "today-met" | "today-unmet" | "met" | "red" | "neutral";

export function DayCard({
  variant = "expanded",
  date,
  wordsWritten,
  goal,
  isToday,
  isFuture,
  casual = false,
  excludedDay = false,
  cheatDay = false,
  canToggleCheat = false,
  onToggleCheat,
}: DayCardProps) {
  if (!date) {
    return <div className={variant === "compact" ? "min-h-12 sm:min-h-15" : ""} />;
  }

  const hasGoal = goal !== null;
  const meetsGoal = hasGoal && wordsWritten >= goal;
  const difference = goal !== null ? wordsWritten - goal : 0;
  const isCompact = variant === "compact";

  let tone: DayTone;
  if (isFuture) {
    tone = "future";
  } else if (cheatDay) {
    // Cheat days are gray no matter how many words were written.
    tone = "neutral";
  } else if (meetsGoal) {
    tone = isToday ? "today-met" : "met";
  } else if (excludedDay) {
    // Planned rest day below target: neutral, not a red miss.
    tone = "neutral";
  } else if (isToday) {
    tone = "today-unmet";
  } else if (casual && wordsWritten === 0) {
    tone = "neutral";
  } else if (hasGoal) {
    tone = "red";
  } else {
    tone = "neutral";
  }

  const showDifference = !isFuture && hasGoal && !cheatDay && !excludedDay;
  const lightText = tone === "today-met" || tone === "met" || tone === "red";

  const containerClasses = cn(
    "group relative flex flex-col overflow-hidden transition-all",
    isCompact ? "rounded-md min-h-12 sm:min-h-15" : "rounded-lg",
    tone === "future" && "border-2 border-dashed border-line opacity-60",
    !isCompact && isToday && "shadow-lg scale-105",
    tone === "today-met" && "border-2 border-green-500",
    tone === "today-unmet" && "border-2 border-line-strong",
    tone === "met" && "border-2 border-green-500/30",
    tone === "red" && "border-2 border-red-500/30",
    tone === "neutral" && "border-2 border-line/50"
  );

  const headerBackgroundClasses = cn(
    isCompact ? "py-0.5 px-1 sm:py-1 sm:px-2 md:px-4" : "py-1 px-2 sm:py-2 sm:px-4",
    tone === "future" && "bg-surface-sunken",
    tone === "today-met" && "bg-green-500",
    tone === "today-unmet" && "bg-surface-sunken/50",
    tone === "met" && "bg-green-500/70",
    tone === "red" && "bg-red-500/70",
    tone === "neutral" && "bg-surface-sunken/50"
  );

  const headerTextClasses = cn(
    isCompact ? "text-xs sm:text-sm" : "text-base sm:text-xl",
    "font-semibold",
    tone === "future" && "text-fg-subtle",
    isToday && "font-bold",
    lightText ? "text-white" : tone === "future" ? "text-fg-subtle" : "text-fg"
  );

  const secondaryHeaderTextClasses = cn(
    "text-xs font-semibold",
    isToday && "font-bold",
    lightText ? "text-white" : tone === "future" ? "text-fg-subtle" : "text-fg"
  );

  const bodyBackgroundClasses = cn(
    tone !== "met" && tone !== "red" && "bg-transparent",
    tone === "met" && "bg-green-500/10",
    tone === "red" && "bg-red-500/10"
  );

  const wordCountClasses = cn(
    isCompact ? "text-xs sm:text-sm" : "text-lg sm:text-2xl",
    "font-bold",
    tone === "future" && "font-semibold text-fg-subtle",
    tone === "today-met" && "text-green-700",
    tone === "met" && "text-green-700/70",
    tone === "red" && "text-red-700/70",
    (tone === "today-unmet" || tone === "neutral") && "text-fg"
  );

  const differenceClasses = cn(
    isCompact ? "text-xs" : "text-sm",
    "font-bold",
    tone === "today-met" && "text-green-700",
    tone === "met" && "text-green-700/70",
    tone === "today-unmet" && "text-fg",
    tone === "neutral" && "text-fg-subtle",
    tone === "red" && "text-red-700/70"
  );

  return (
    <div
      className={containerClasses}
      role="gridcell"
      aria-label={`${date.toLocaleDateString("en-US", { month: "long", day: "numeric" })}${goal ? `, goal: ${formatWordCount(goal)} words` : ""}${!isFuture ? `, written: ${formatWordCount(wordsWritten)} words` : ""}${cheatDay ? ", cheat day" : ""}${excludedDay ? ", rest day" : ""}`}
    >
      {canToggleCheat && onToggleCheat && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onToggleCheat();
          }}
          aria-label={cheatDay ? "Remove cheat day" : "Use a cheat day"}
          aria-pressed={cheatDay}
          className={cn(
            "absolute right-0.5 top-0.5 z-10 inline-flex items-center justify-center rounded-full p-0.5 transition-opacity",
            cheatDay
              ? "text-sky-600 opacity-100"
              : "text-fg-subtle opacity-0 hover:text-sky-600 focus-visible:opacity-100 group-hover:opacity-100"
          )}
        >
          <LuSnowflake className={isCompact ? "h-3 w-3" : "h-4 w-4"} aria-hidden />
        </button>
      )}
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
