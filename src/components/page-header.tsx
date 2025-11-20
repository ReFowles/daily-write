import Link from "next/link";

interface PageHeaderProps {
  title: string;
  description: string;
  dailyGoal: number;
  daysLeft: number;
  writtenToday: number;
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
  dailyGoal,
  daysLeft,
  writtenToday,
  goalStartDate,
  goalEndDate,
  showNewGoalButton = true,
  showWriteButton = true,
  onNewGoalClick,
  newGoalButtonText = "New Goal",
}: PageHeaderProps) {
  // Format date range
  const formatDateRange = () => {
    if (!goalStartDate || !goalEndDate) return "No active goal";
    
    const start = new Date(goalStartDate + 'T00:00:00');
    const end = new Date(goalEndDate + 'T00:00:00');
    
    const startFormatted = `${start.getMonth() + 1}/${start.getDate()}`;
    const endFormatted = `${end.getMonth() + 1}/${end.getDate()}`;
    
    return `${startFormatted} – ${endFormatted}`;
  };

  return (
    <div className="mb-8 flex items-start justify-between gap-6">
      {/* Title and description */}
      <div>
        <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50 strawberry:text-rose-900 cherry:text-rose-300 seafoam:text-cyan-900 ocean:text-cyan-300">
          {title}
        </h1>
        <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400 strawberry:text-rose-700 cherry:text-rose-400 seafoam:text-cyan-700 ocean:text-cyan-400">
          {description}
        </p>
      </div>

      {/* Stats cards and action buttons */}
      <div className="flex flex-wrap items-stretch justify-end gap-3">
        {/* Today Card */}
        <div className="flex flex-col rounded-lg border border-zinc-200 bg-white px-4 py-2 text-center dark:border-zinc-800 dark:bg-zinc-900 strawberry:border-rose-200 strawberry:bg-white cherry:border-rose-900 cherry:bg-rose-950 seafoam:border-cyan-200 seafoam:bg-white ocean:border-cyan-900 ocean:bg-cyan-950">
          <div className="text-xs text-zinc-600 dark:text-zinc-400 strawberry:text-rose-700 cherry:text-rose-400 seafoam:text-cyan-700 ocean:text-cyan-400">
            Today
          </div>
          <div className={`flex flex-1 items-center justify-center text-2xl font-semibold ${
            writtenToday >= dailyGoal
              ? "text-green-700 dark:text-green-400 strawberry:text-green-700 cherry:text-green-400 seafoam:text-green-700 ocean:text-green-400"
              : "text-zinc-900 dark:text-zinc-50 strawberry:text-rose-900 cherry:text-rose-300 seafoam:text-cyan-900 ocean:text-cyan-300"
          }`}>
            {writtenToday}
          </div>
        </div>

        {/* Today's Goal Card */}
        <div className="flex flex-col rounded-lg border border-zinc-200 bg-white px-4 py-2 text-center dark:border-zinc-800 dark:bg-zinc-900 strawberry:border-rose-200 strawberry:bg-white cherry:border-rose-900 cherry:bg-rose-950 seafoam:border-cyan-200 seafoam:bg-white ocean:border-cyan-900 ocean:bg-cyan-950">
          <div className="text-xs text-zinc-600 dark:text-zinc-400 strawberry:text-rose-700 cherry:text-rose-400 seafoam:text-cyan-700 ocean:text-cyan-400">
            Goal
          </div>
          <div className="flex flex-1 items-center justify-center text-lg font-semibold text-zinc-900 dark:text-zinc-50 strawberry:text-rose-900 cherry:text-rose-300 seafoam:text-cyan-900 ocean:text-cyan-300">
            {dailyGoal}
          </div>
        </div>

        {/* Current Goal Period Card */}
        <div className="flex flex-col rounded-lg border border-zinc-200 bg-white px-4 py-2 text-center dark:border-zinc-800 dark:bg-zinc-900 strawberry:border-rose-200 strawberry:bg-white cherry:border-rose-900 cherry:bg-rose-950 seafoam:border-cyan-200 seafoam:bg-white ocean:border-cyan-900 ocean:bg-cyan-950">
          <div className="text-xs text-zinc-600 dark:text-zinc-400 strawberry:text-rose-700 cherry:text-rose-400 seafoam:text-cyan-700 ocean:text-cyan-400">
            Current
          </div>
          <div className="flex flex-1 items-center justify-center text-lg font-semibold text-zinc-900 dark:text-zinc-50 strawberry:text-rose-900 cherry:text-rose-300 seafoam:text-cyan-900 ocean:text-cyan-300">
            {formatDateRange()}
          </div>
        </div>

        {/* Days Left Card */}
        <div className="flex flex-col rounded-lg border border-zinc-200 bg-white px-4 py-2 text-center dark:border-zinc-800 dark:bg-zinc-900 strawberry:border-rose-200 strawberry:bg-white cherry:border-rose-900 cherry:bg-rose-950 seafoam:border-cyan-200 seafoam:bg-white ocean:border-cyan-900 ocean:bg-cyan-950">
          <div className="text-xs text-zinc-600 dark:text-zinc-400 strawberry:text-rose-700 cherry:text-rose-400 seafoam:text-cyan-700 ocean:text-cyan-400">
            Days Left
          </div>
          <div className="flex flex-1 items-center justify-center text-lg font-semibold text-zinc-900 dark:text-zinc-50 strawberry:text-rose-900 cherry:text-rose-300 seafoam:text-cyan-900 ocean:text-cyan-300">
            {daysLeft}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          {showNewGoalButton && (
            <>
              {onNewGoalClick ? (
                <button
                  onClick={onNewGoalClick}
                  className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 strawberry:border-rose-300 strawberry:bg-white strawberry:text-rose-700 strawberry:hover:bg-rose-50 cherry:border-rose-800 cherry:bg-rose-950 cherry:text-rose-300 cherry:hover:bg-rose-900 seafoam:border-cyan-300 seafoam:bg-white seafoam:text-cyan-700 seafoam:hover:bg-cyan-50 ocean:border-cyan-800 ocean:bg-cyan-950 ocean:text-cyan-300 ocean:hover:bg-cyan-900"
                >
                  {newGoalButtonText}
                </button>
              ) : (
                <Link
                  href="/goals?new=true"
                  className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 text-center text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 strawberry:border-rose-300 strawberry:bg-white strawberry:text-rose-700 strawberry:hover:bg-rose-50 cherry:border-rose-800 cherry:bg-rose-950 cherry:text-rose-300 cherry:hover:bg-rose-900 seafoam:border-cyan-300 seafoam:bg-white seafoam:text-cyan-700 seafoam:hover:bg-cyan-50 ocean:border-cyan-800 ocean:bg-cyan-950 ocean:text-cyan-300 ocean:hover:bg-cyan-900"
                >
                  {newGoalButtonText}
                </Link>
              )}
            </>
          )}
          {showWriteButton && (
            <Link
              href="/write"
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-blue-700 strawberry:bg-linear-to-r strawberry:from-rose-500 strawberry:to-pink-500 strawberry:hover:from-rose-600 strawberry:hover:to-pink-600 cherry:bg-linear-to-r cherry:from-rose-700 cherry:to-pink-700 cherry:hover:from-rose-600 cherry:hover:to-pink-600 seafoam:bg-linear-to-r seafoam:from-cyan-500 seafoam:to-blue-500 seafoam:hover:from-cyan-600 seafoam:hover:to-blue-600 ocean:bg-linear-to-r ocean:from-cyan-700 ocean:to-blue-700 ocean:hover:from-cyan-600 ocean:hover:to-blue-600"
            >
              Write
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
