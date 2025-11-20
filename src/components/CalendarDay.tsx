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

  const getWordCountClasses = () => {
    if (isFuture) {
      return "text-sm font-medium text-zinc-400 dark:text-zinc-600 strawberry:text-rose-400 cherry:text-rose-700 seafoam:text-cyan-400 ocean:text-cyan-700";
    }

    if (!hasGoal) {
      return "text-sm font-semibold text-zinc-600 dark:text-zinc-400 strawberry:text-rose-700 cherry:text-rose-400 seafoam:text-cyan-700 ocean:text-cyan-400";
    }

    if (meetsGoal) {
      return "text-sm font-semibold text-green-600 dark:text-green-400 cherry:text-green-400 ocean:text-green-400";
    }

    return "text-sm font-semibold text-red-600 dark:text-red-400 cherry:text-red-400 ocean:text-red-400";
  };

  const getDifferenceTextClasses = () => {
    if (meetsGoal) {
      return "text-xs font-medium text-green-600 dark:text-green-500 cherry:text-green-500 ocean:text-green-500";
    }
    return "text-xs font-medium text-red-600 dark:text-red-500 cherry:text-red-500 ocean:text-red-500";
  };

  const getHeaderClasses = () => {
    if (isFuture) {
      return "py-1 px-1.5 bg-zinc-200 dark:bg-zinc-800 strawberry:bg-rose-200 cherry:bg-rose-900 seafoam:bg-cyan-200 ocean:bg-cyan-900";
    }
    
    if (isToday) {
      if (meetsGoal) {
        return "py-1 px-1.5 bg-green-500 dark:bg-green-700 cherry:bg-green-700 ocean:bg-green-700";
      }
      return "py-1 px-1.5 bg-zinc-200/50 dark:bg-zinc-800/50 strawberry:bg-rose-200/50 cherry:bg-rose-900/50 seafoam:bg-cyan-200/50 ocean:bg-cyan-900/50";
    }
    
    if (meetsGoal) {
      return "py-1 px-1.5 bg-green-500/70 dark:bg-green-700/70 cherry:bg-green-700/70 ocean:bg-green-700/70";
    } else {
      return "py-1 px-1.5 bg-red-500/70 dark:bg-red-700/70 cherry:bg-red-700/70 ocean:bg-red-700/70";
    }
  };

  const getHeaderTextClasses = () => {
    if (isFuture) {
      return "text-sm font-semibold text-zinc-500 dark:text-zinc-400 strawberry:text-rose-600 cherry:text-rose-500 seafoam:text-cyan-600 ocean:text-cyan-500";
    }
    
    if (isToday) {
      if (meetsGoal) {
        return "text-sm font-bold text-white";
      }
      return "text-sm font-bold text-zinc-900 dark:text-zinc-100 strawberry:text-rose-900 cherry:text-rose-300 seafoam:text-cyan-900 ocean:text-cyan-300";
    }
    
    return "text-sm font-semibold text-white";
  };

  const getGoalHeaderTextClasses = () => {
    if (isFuture) {
      return "text-xs font-normal text-zinc-500 dark:text-zinc-400 strawberry:text-rose-600 cherry:text-rose-500 seafoam:text-cyan-600 ocean:text-cyan-500";
    }
    
    if (isToday) {
      if (meetsGoal) {
        return "text-xs font-normal text-white";
      }
      return "text-xs font-normal text-zinc-900 dark:text-zinc-100 strawberry:text-rose-900 cherry:text-rose-300 seafoam:text-cyan-900 ocean:text-cyan-300";
    }
    
    return "text-xs font-normal text-white";
  };

  const getBodyBackgroundClasses = () => {
    if (isFuture || isToday) {
      return 'bg-transparent';
    }
    if (meetsGoal) {
      return 'bg-green-500/10 dark:bg-green-700/10 cherry:bg-green-700/10 ocean:bg-green-700/10';
    }
    return 'bg-red-500/10 dark:bg-red-700/10 cherry:bg-red-700/10 ocean:bg-red-700/10';
  };

  const getBorderClasses = () => {
    if (isToday) {
      return "border-2 border-blue-500 dark:border-blue-400 strawberry:border-blue-500 cherry:border-blue-400 seafoam:border-blue-500 ocean:border-blue-400 shadow-md";
    }
    return "border border-zinc-200 dark:border-zinc-800 strawberry:border-rose-200 cherry:border-rose-900 seafoam:border-cyan-200 ocean:border-cyan-900";
  };

  return (
    <div
      className={`relative min-h-[60px] rounded-md transition-all bg-white dark:bg-zinc-900 strawberry:bg-pink-50/30 cherry:bg-zinc-900/30 seafoam:bg-cyan-50/30 ocean:bg-zinc-900/30 ${getBorderClasses()} hover:shadow-sm overflow-hidden flex flex-col`}
    >
      {/* Date Header */}
      <div className={getHeaderClasses()}>
        <div className="flex items-center justify-between">
          <span className={getHeaderTextClasses()}>{date.getDate()}</span>
          {goal !== null && <span className={getGoalHeaderTextClasses()}>/ {goal}</span>}
        </div>
      </div>

      {/* Content Area */}
      <div className={`flex-1 flex flex-col justify-end items-center p-1.5 space-y-0 ${getBodyBackgroundClasses()}`}>
        {/* Word Count */}
        {!isFuture && (
          <div className={getWordCountClasses()}>{wordsWritten}</div>
        )}

        {/* Difference */}
        {showDifference && (
          <div className={getDifferenceTextClasses()}>
            {difference > 0 ? `+${difference}` : difference}
          </div>
        )}
      </div>
    </div>
  );
}
