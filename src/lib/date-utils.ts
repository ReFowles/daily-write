export interface DayData {
  date: Date;
  wordsWritten: number;
  goal: number;
}

export interface WritingSession {
  date: string;
  wordCount: number;
}

/**
 * Generate a 5-day window of day data (2 days before, today, 2 days after)
 */
export function generateWeekWindow(
  dailyGoal: number,
  writingSessions: WritingSession[]
): DayData[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Create a map for quick lookup
  const sessionMap = new Map<string, number>();
  writingSessions.forEach((session) => {
    sessionMap.set(session.date, session.wordCount);
  });
  
  const days: DayData[] = [];
  for (let i = -2; i <= 2; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dateString = date.toISOString().split('T')[0];
    days.push({
      date,
      wordsWritten: sessionMap.get(dateString) || 0,
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

/**
 * Format a date string (YYYY-MM-DD) to a readable format
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
