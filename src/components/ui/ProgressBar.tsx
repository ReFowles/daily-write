import { cn } from "@/lib/class-utils";

interface ProgressBarProps {
  /** Progress value between 0 and 100 */
  value: number;
  /** Height variant of the progress bar */
  size?: "sm" | "md" | "lg";
  /** Optional CSS class name */
  className?: string;
  /** Whether the goal is completed (uses green if goal was met, red if not) */
  isCompleted?: boolean;
}

export function ProgressBar({
  value,
  size = "md",
  className = "",
  isCompleted = false,
}: ProgressBarProps) {
  const percentage = Math.min(Math.max(value, 0), 100);

  const sizeClasses = {
    sm: "h-2",
    md: "h-3",
    lg: "h-4",
  };

  // Completed goals get a semantic green/red fill; everything else uses the
  // themed accent (a rainbow under Energy/Ambition).
  const fillClasses = isCompleted
    ? percentage >= 100
      ? "bg-green-500"
      : "bg-red-500"
    : "accent-fill";

  return (
    <div
      className={cn(
        "overflow-hidden rounded-full bg-surface-sunken",
        sizeClasses[size],
        className
      )}
    >
      <div
        className={cn("h-full transition-all duration-300", fillClasses)}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
