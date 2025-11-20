import { Card } from "./ui/Card";
import { DayCard } from "./DayCard";
import { generateWeekWindow, isToday, isFuture } from "@/lib/date-utils";
import type { WritingSession } from "@/lib/types";

interface WeeklyCalendarProps {
  dailyGoal: number;
  writingSessions: WritingSession[];
}

export function WeeklyCalendar({ dailyGoal, writingSessions }: WeeklyCalendarProps) {
  const days = generateWeekWindow(dailyGoal, writingSessions);

  return (
    <Card className="p-6">
      <h2 className="mb-6 text-xl font-semibold text-zinc-900 dark:text-zinc-50 strawberry:text-rose-900 cherry:text-rose-300 seafoam:text-cyan-900 ocean:text-cyan-300">
        This Week
      </h2>
      <div className="grid grid-cols-5 gap-3">
        {days.map((day, index) => (
          <DayCard
            key={index}
            date={day.date}
            wordsWritten={day.wordsWritten}
            goal={day.goal}
            isToday={isToday(day.date)}
            isFuture={isFuture(day.date)}
          />
        ))}
      </div>
    </Card>
  );
}
