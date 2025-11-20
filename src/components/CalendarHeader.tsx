import { ChevronRight, ChevronLeft } from "./icons";
import { Button } from "./ui/Button";
import { themeClasses } from "@/lib/theme-utils";
import { cn } from "@/lib/class-utils";

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
        <div className={cn("flex items-center gap-2 text-xl font-semibold", themeClasses.text.primary)}>
          <ChevronRight className={`transition-transform ${isExpanded ? "rotate-90" : ""}`} />
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
        <Button variant="icon" onClick={onPreviousMonth} aria-label="Previous month">
          <ChevronLeft className={themeClasses.text.link} />
        </Button>
        <Button variant="icon" onClick={onToday} aria-label="Go to today" className="px-3">
          <span className={cn("text-sm", themeClasses.text.link)}>Today</span>
        </Button>
        <Button variant="icon" onClick={onNextMonth} aria-label="Next month">
          <ChevronRight className={themeClasses.text.link} />
        </Button>
      </div>
    </div>
  );
}
