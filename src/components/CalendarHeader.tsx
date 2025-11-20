interface CalendarHeaderProps {
  monthName: string;
  year: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  children?: React.ReactNode;
}

export function CalendarHeader({
  monthName,
  year,
  isExpanded,
  onToggleExpand,
  onPreviousMonth,
  onNextMonth,
  onToday,
  children,
}: CalendarHeaderProps) {
  return (
    <div 
      className={`flex items-center justify-between gap-4 cursor-pointer ${isExpanded ? "mb-4" : ""}`}
      onClick={onToggleExpand}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggleExpand();
        }
      }}
      aria-expanded={isExpanded}
      aria-label={isExpanded ? "Collapse calendar" : "Expand calendar"}
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50 strawberry:text-rose-900 cherry:text-rose-300 seafoam:text-cyan-900 ocean:text-cyan-300">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform ${isExpanded ? "rotate-90" : ""}`}
            aria-hidden="true"
          >
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
          {monthName} {year}
        </div>
        
        {/* Goal Legend */}
        {children}
      </div>

      {/* Navigation buttons */}
      <div 
        className="flex items-center gap-2" 
        role="group" 
        aria-label="Calendar navigation"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onPreviousMonth}
          className="rounded-md p-2 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 strawberry:hover:bg-rose-100 cherry:hover:bg-rose-900 seafoam:hover:bg-cyan-100 ocean:hover:bg-cyan-900"
          aria-label="Previous month"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-zinc-700 dark:text-zinc-300 strawberry:text-rose-800 cherry:text-rose-300 seafoam:text-cyan-800 ocean:text-cyan-300"
            aria-hidden="true"
          >
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <button
          onClick={onToday}
          className="rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 strawberry:hover:bg-rose-100 cherry:hover:bg-rose-900 seafoam:hover:bg-cyan-100 ocean:hover:bg-cyan-900 text-zinc-700 dark:text-zinc-300 strawberry:text-rose-800 cherry:text-rose-300 seafoam:text-cyan-800 ocean:text-cyan-300"
          aria-label="Go to today"
        >
          Today
        </button>
        <button
          onClick={onNextMonth}
          className="rounded-md p-2 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 strawberry:hover:bg-rose-100 cherry:hover:bg-rose-900 seafoam:hover:bg-cyan-100 ocean:hover:bg-cyan-900"
          aria-label="Next month"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-zinc-700 dark:text-zinc-300 strawberry:text-rose-800 cherry:text-rose-300 seafoam:text-cyan-800 ocean:text-cyan-300"
            aria-hidden="true"
          >
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </div>
    </div>
  );
}
