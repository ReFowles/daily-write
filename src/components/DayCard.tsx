interface DayCardProps {
  date: Date;
  wordsWritten: number;
  goal: number;
  isToday: boolean;
  isFuture: boolean;
}

export function DayCard({ date, wordsWritten, goal, isToday, isFuture }: DayCardProps) {
  const meetsGoal = wordsWritten >= goal;
  const difference = wordsWritten - goal;
  const displayValue = isFuture ? goal : wordsWritten;
  const showDifference = !isFuture && difference !== 0;

  const formatDayOfWeek = (date: Date) => {
    return date.toLocaleDateString("en-US", { weekday: "short" });
  };

  const formatMonthDay = (date: Date) => {
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const getDayClasses = () => {
    const baseClasses = "flex flex-col rounded-lg overflow-hidden transition-all";
    
    if (isFuture) {
      return `${baseClasses} border-2 border-dashed border-zinc-300 dark:border-zinc-700 strawberry:border-rose-300 cherry:border-rose-800 seafoam:border-cyan-300 ocean:border-cyan-800 opacity-60`;
    }
    
    if (isToday) {
      if (meetsGoal) {
        return `${baseClasses} shadow-lg scale-105 border-2 border-green-500 dark:border-green-700 cherry:border-green-700 ocean:border-green-700`;
      }
      return `${baseClasses} shadow-lg scale-105 border-2 border-zinc-400 dark:border-zinc-600 strawberry:border-rose-400 cherry:border-rose-600 seafoam:border-cyan-400 ocean:border-cyan-600`;
    }
    
    if (meetsGoal) {
      return `${baseClasses} border-2 border-green-500/70 dark:border-green-700/70 cherry:border-green-700/70 ocean:border-green-700/70`;
    } else {
      return `${baseClasses} border-2 border-red-500/70 dark:border-red-700/70 cherry:border-red-700/70 ocean:border-red-700/70`;
    }
  };

  const getHeaderClasses = () => {
    if (isFuture) {
      return "py-2 px-4 bg-zinc-200 dark:bg-zinc-800 strawberry:bg-rose-200 cherry:bg-rose-900 seafoam:bg-cyan-200 ocean:bg-cyan-900";
    }
    
    if (isToday) {
      if (meetsGoal) {
        return "py-2 px-4 bg-green-500 dark:bg-green-700 cherry:bg-green-700 ocean:bg-green-700";
      }
      return "py-2 px-4 bg-zinc-200/50 dark:bg-zinc-800/50 strawberry:bg-rose-200/50 cherry:bg-rose-900/50 seafoam:bg-cyan-200/50 ocean:bg-cyan-900/50";
    }
    
    if (meetsGoal) {
      return "py-2 px-4 bg-green-500/70 dark:bg-green-700/70 cherry:bg-green-700/70 ocean:bg-green-700/70";
    } else {
      return "py-2 px-4 bg-red-500/70 dark:bg-red-700/70 cherry:bg-red-700/70 ocean:bg-red-700/70";
    }
  };

  const getHeaderTextClasses = (isLarge = false) => {
    const size = isLarge ? "text-xl" : "text-xs";
    
    if (isFuture) {
      return `${size} font-semibold text-zinc-500 dark:text-zinc-400 strawberry:text-rose-600 cherry:text-rose-500 seafoam:text-cyan-600 ocean:text-cyan-500`;
    }
    
    if (isToday) {
      if (meetsGoal) {
        return `${size} font-bold text-white`;
      }
      return `${size} font-bold text-zinc-900 dark:text-zinc-100 strawberry:text-rose-900 cherry:text-rose-300 seafoam:text-cyan-900 ocean:text-cyan-300`;
    }
    
    return `${size} font-semibold text-white`;
  };

  const getBodyTextClasses = (isLarge = false) => {
    const size = isLarge ? "text-2xl" : "text-sm";
    
    if (isFuture) {
      return `${size} font-semibold text-zinc-500 dark:text-zinc-400 strawberry:text-rose-600 cherry:text-rose-500 seafoam:text-cyan-600 ocean:text-cyan-500`;
    }
    
    if (isToday) {
      if (meetsGoal) {
        return `${size} font-bold text-green-700 dark:text-green-400 cherry:text-green-400 ocean:text-green-400`;
      }
      return `${size} font-bold text-zinc-900 dark:text-zinc-100 strawberry:text-rose-900 cherry:text-rose-300 seafoam:text-cyan-900 ocean:text-cyan-300`;
    }
    
    if (meetsGoal) {
      return `${size} font-bold text-green-700/70 dark:text-green-400/70 cherry:text-green-400/70 ocean:text-green-400/70`;
    } else {
      return `${size} font-bold text-red-700/70 dark:text-red-400/70 cherry:text-red-400/70 ocean:text-red-400/70`;
    }
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

  return (
    <div className={getDayClasses()}>
      {/* Date Header */}
      <div className={getHeaderClasses()}>
        <div className="text-center">
          <div className={getHeaderTextClasses(false)}>
            {formatDayOfWeek(date)}
          </div>
          <div className={getHeaderTextClasses(true)}>
            {formatMonthDay(date)}
          </div>
        </div>
      </div>

      {/* Word Count Body */}
      <div className={`py-4 px-4 text-center ${getBodyBackgroundClasses()}`}>
        <div className={getBodyTextClasses(true)}>
          {displayValue}
          {isFuture && (
            <span className="ml-1 text-sm font-normal opacity-75">goal</span>
          )}
        </div>
        {showDifference && (
          <div className={`mt-1 ${getBodyTextClasses(false)}`}>
            {difference > 0 ? '+' : ''}{difference}
          </div>
        )}
      </div>
    </div>
  );
}
