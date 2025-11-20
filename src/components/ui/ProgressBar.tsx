interface ProgressBarProps {
  /** Progress value between 0 and 100 */
  value: number;
  /** Height variant of the progress bar */
  size?: "sm" | "md" | "lg";
  /** Optional CSS class name */
  className?: string;
  /** Whether the goal is completed (uses green color if goal was met, red if not) */
  isCompleted?: boolean;
}

export function ProgressBar({ 
  value, 
  size = "md", 
  className = "",
  isCompleted = false
}: ProgressBarProps) {
  const percentage = Math.min(Math.max(value, 0), 100);
  
  const sizeClasses = {
    sm: "h-2",
    md: "h-3",
    lg: "h-4"
  };

  const fillColorClasses = isCompleted
    ? percentage >= 100
      ? "bg-green-500 dark:bg-green-600"
      : "bg-red-500 dark:bg-red-600"
    : "bg-blue-600 strawberry:bg-linear-to-r strawberry:from-rose-500 strawberry:to-pink-500 cherry:bg-linear-to-r cherry:from-rose-600 cherry:to-pink-600 seafoam:bg-linear-to-r seafoam:from-cyan-500 seafoam:to-blue-500 ocean:bg-linear-to-r ocean:from-cyan-600 ocean:to-blue-600";

  return (
    <div className={`overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800 strawberry:bg-pink-200 cherry:bg-rose-900 seafoam:bg-cyan-200 ocean:bg-cyan-900 ${sizeClasses[size]} ${className}`}>
      <div
        className={`h-full transition-all duration-300 ${fillColorClasses}`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
