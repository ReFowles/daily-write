export interface DayData {
  date: Date;
  wordsWritten: number;
  goal: number;
}

/**
 * Generate a 5-day window of day data (2 days before, today, 2 days after)
 */
export function generateWeekWindow(
  dailyGoal: number,
  wordsByDate: Record<string, number>
): DayData[] {
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
  
  return days;
}

/**
 * Check if a date is today
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date.getTime() === today.getTime();
}

/**
 * Check if a date is in the future
 */
export function isFuture(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date > today;
}
