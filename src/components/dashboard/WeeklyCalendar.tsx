import { Card } from "@/components/ui/Card";
import { DayCard } from "@/components/DayCard";
import { generateWeekWindow, isToday, isFuture, toDateString } from "@/lib/date-utils";
import { themeClasses } from "@/lib/theme-utils";
import { cn } from "@/lib/class-utils";
import type { WritingSession, Goal } from "@/lib/types";

interface WeeklyCalendarProps {
  goals: Goal[];
  writingSessions: WritingSession[];
  onToggleCheatDay?: (goalId: string, date: string) => void;
}

export function WeeklyCalendar({ goals, writingSessions, onToggleCheatDay }: WeeklyCalendarProps) {
  const days = generateWeekWindow(goals, writingSessions);

  return (
    <Card className="p-3 sm:p-6">
      <h2 className={cn("mb-4 text-lg font-semibold sm:mb-6 sm:text-xl", themeClasses.text.primary)}>
        This Week
      </h2>
      <div className="grid grid-cols-5 gap-1 sm:gap-3">
        {days.map((day, index) => (
          <DayCard
            key={index}
            variant="expanded"
            date={day.date}
            wordsWritten={day.wordsWritten}
            goal={day.goal}
            isToday={isToday(day.date)}
            isFuture={isFuture(day.date)}
            casual={day.casual}
            excludedDay={day.excluded}
            cheatDay={day.cheatDay}
            canToggleCheat={day.canToggleCheat && !!onToggleCheatDay}
            onToggleCheat={
              day.goalId && onToggleCheatDay
                ? () => onToggleCheatDay(day.goalId!, toDateString(day.date))
                : undefined
            }
          />
        ))}
      </div>
    </Card>
  );
}
