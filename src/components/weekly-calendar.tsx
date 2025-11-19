import { Card } from "./ui/card";

interface DayData {
  date: Date;
  wordsWritten: number;
  goal: number;
}

interface WeeklyCalendarProps {
  dailyGoal: number;
  wordsByDate: Record<string, number>; // date string (YYYY-MM-DD) -> word count
}

export function WeeklyCalendar({ dailyGoal, wordsByDate }: WeeklyCalendarProps) {
  // Get the 5-day window (2 days before, today, 2 days after)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const days: DayData[] = [];
  for (let i = -2; i <= 2; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dateString = date.toISOString().split('T')[0];
    days.push({
      date,
      wordsWritten: wordsByDate[dateString] || 0,
      goal: dailyGoal,
    });
  }

  const formatDayOfWeek = (date: Date) => {
    return date.toLocaleDateString("en-US", { weekday: "short" });
  };

  const formatMonthDay = (date: Date) => {
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const isToday = (date: Date) => {
    return date.getTime() === today.getTime();
  };

  const isFuture = (date: Date) => {
    return date > today;
  };

  const meetsGoal = (wordsWritten: number, goal: number) => {
    return wordsWritten >= goal;
  };

  const getDayClasses = (date: Date, wordsWritten: number, goal: number) => {
    const baseClasses = "flex flex-col rounded-lg overflow-hidden transition-all";
    
    if (isFuture(date)) {
      // Future days - disabled appearance
      return `${baseClasses} border-2 border-dashed border-zinc-300 dark:border-zinc-700 strawberry:border-rose-300 cherry:border-rose-800 seafoam:border-cyan-300 ocean:border-cyan-800 opacity-60`;
    }
    
    const current = isToday(date);
    const goalMet = meetsGoal(wordsWritten, goal);
    
    if (current) {
      // Current day - full opacity green border if goal met, neutral if not
      if (goalMet) {
        return `${baseClasses} shadow-lg scale-105 border-2 border-green-500 dark:border-green-700 cherry:border-green-700 ocean:border-green-700`;
      }
      return `${baseClasses} shadow-lg scale-105 border-2 border-zinc-400 dark:border-zinc-600 strawberry:border-rose-400 cherry:border-rose-600 seafoam:border-cyan-400 ocean:border-cyan-600`;
    }
    
    if (goalMet) {
      // Goal met - green border with reduced opacity
      return `${baseClasses} border-2 border-green-500/70 dark:border-green-700/70 cherry:border-green-700/70 ocean:border-green-700/70`;
    } else {
      // Goal not met - red border with reduced opacity
      return `${baseClasses} border-2 border-red-500/70 dark:border-red-700/70 cherry:border-red-700/70 ocean:border-red-700/70`;
    }
  };

  const getHeaderClasses = (date: Date, wordsWritten: number, goal: number) => {
    if (isFuture(date)) {
      // Future days - muted header
      return "py-2 px-4 bg-zinc-200 dark:bg-zinc-800 strawberry:bg-rose-200 cherry:bg-rose-900 seafoam:bg-cyan-200 ocean:bg-cyan-900";
    }
    
    const current = isToday(date);
    const goalMet = meetsGoal(wordsWritten, goal);
    
    if (current) {
      // Current day - full opacity green header if goal met, subtle neutral if not
      if (goalMet) {
        return "py-2 px-4 bg-green-500 dark:bg-green-700 cherry:bg-green-700 ocean:bg-green-700";
      }
      return "py-2 px-4 bg-zinc-200/50 dark:bg-zinc-800/50 strawberry:bg-rose-200/50 cherry:bg-rose-900/50 seafoam:bg-cyan-200/50 ocean:bg-cyan-900/50";
    }
    
    if (goalMet) {
      // Goal met - green header with reduced opacity
      return "py-2 px-4 bg-green-500/70 dark:bg-green-700/70 cherry:bg-green-700/70 ocean:bg-green-700/70";
    } else {
      // Goal not met - red header with reduced opacity
      return "py-2 px-4 bg-red-500/70 dark:bg-red-700/70 cherry:bg-red-700/70 ocean:bg-red-700/70";
    }
  };

  const getHeaderTextClasses = (date: Date, wordsWritten: number, goal: number, isLarge = false) => {
    const size = isLarge ? "text-xl" : "text-xs";
    
    if (isFuture(date)) {
      return `${size} font-semibold text-zinc-500 dark:text-zinc-400 strawberry:text-rose-600 cherry:text-rose-500 seafoam:text-cyan-600 ocean:text-cyan-500`;
    }
    
    const current = isToday(date);
    const goalMet = meetsGoal(wordsWritten, goal);
    
    if (current) {
      // Current day - white text if goal met, theme text color if not
      if (goalMet) {
        return `${size} font-bold text-white`;
      }
      return `${size} font-bold text-zinc-900 dark:text-zinc-100 strawberry:text-rose-900 cherry:text-rose-300 seafoam:text-cyan-900 ocean:text-cyan-300`;
    }
    
    // Past days - white text on colored headers
    return `${size} font-semibold text-white`;
  };

  const getBodyTextClasses = (date: Date, wordsWritten: number, goal: number, isLarge = false) => {
    const size = isLarge ? "text-2xl" : "text-sm";
    
    if (isFuture(date)) {
      return `${size} font-semibold text-zinc-500 dark:text-zinc-400 strawberry:text-rose-600 cherry:text-rose-500 seafoam:text-cyan-600 ocean:text-cyan-500`;
    }
    
    const current = isToday(date);
    const goalMet = meetsGoal(wordsWritten, goal);
    
    if (current) {
      // Current day - full opacity green text if goal met, theme text color if not
      if (goalMet) {
        return `${size} font-bold text-green-700 dark:text-green-400 cherry:text-green-400 ocean:text-green-400`;
      }
      return `${size} font-bold text-zinc-900 dark:text-zinc-100 strawberry:text-rose-900 cherry:text-rose-300 seafoam:text-cyan-900 ocean:text-cyan-300`;
    }
    
    if (goalMet) {
      // Goal met - green text with reduced opacity
      return `${size} font-bold text-green-700/70 dark:text-green-400/70 cherry:text-green-400/70 ocean:text-green-400/70`;
    } else {
      // Goal not met - red text with reduced opacity
      return `${size} font-bold text-red-700/70 dark:text-red-400/70 cherry:text-red-400/70 ocean:text-red-400/70`;
    }
  };

  return (
    <Card className="p-6">
      <h2 className="mb-6 text-xl font-semibold text-zinc-900 dark:text-zinc-50 strawberry:text-rose-900 cherry:text-rose-300 seafoam:text-cyan-900 ocean:text-cyan-300">
        This Week
      </h2>
      <div className="grid grid-cols-5 gap-3">
        {days.map((day, index) => {
          const future = isFuture(day.date);
          const difference = day.wordsWritten - day.goal;
          const displayValue = future ? day.goal : day.wordsWritten;
          const showDifference = !future && difference !== 0;
          
          return (
            <div
              key={index}
              className={getDayClasses(day.date, day.wordsWritten, day.goal)}
            >
              {/* Date Header */}
              <div className={getHeaderClasses(day.date, day.wordsWritten, day.goal)}>
                <div className="text-center">
                  <div className={getHeaderTextClasses(day.date, day.wordsWritten, day.goal, false)}>
                    {formatDayOfWeek(day.date)}
                  </div>
                  <div className={getHeaderTextClasses(day.date, day.wordsWritten, day.goal, true)}>
                    {formatMonthDay(day.date)}
                  </div>
                </div>
              </div>

              {/* Word Count Body */}
              <div className={`py-4 px-4 text-center ${
                future || isToday(day.date)
                  ? 'bg-transparent' 
                  : meetsGoal(day.wordsWritten, day.goal)
                    ? 'bg-green-500/10 dark:bg-green-700/10 cherry:bg-green-700/10 ocean:bg-green-700/10'
                    : 'bg-red-500/10 dark:bg-red-700/10 cherry:bg-red-700/10 ocean:bg-red-700/10'
              }`}>
                <div className={getBodyTextClasses(day.date, day.wordsWritten, day.goal, true)}>
                  {displayValue}
                  {future && (
                    <span className="ml-1 text-sm font-normal opacity-75">goal</span>
                  )}
                </div>
                {showDifference && (
                  <div className={`mt-1 ${getBodyTextClasses(day.date, day.wordsWritten, day.goal, false)}`}>
                    {difference > 0 ? '+' : ''}{difference}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
