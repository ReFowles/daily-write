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

/**
 * Calculate the number of days remaining until a goal end date
 */
export function calculateDaysLeft(endDateString: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = new Date(endDateString + 'T00:00:00');
  return Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Get the first day of the month for a given date
 */
export function getFirstDayOfMonth(year: number, month: number): Date {
  return new Date(year, month, 1);
}

/**
 * Get the last day of the month for a given date
 */
export function getLastDayOfMonth(year: number, month: number): Date {
  return new Date(year, month + 1, 0);
}

/**
 * Get the day of week (0-6) for the first day of the month
 */
export function getFirstDayOfWeek(year: number, month: number): number {
  return getFirstDayOfMonth(year, month).getDay();
}

/**
 * Get the number of days in a month
 */
export function getDaysInMonth(year: number, month: number): number {
  return getLastDayOfMonth(year, month).getDate();
}

/**
 * Check if a date falls within a date range (inclusive)
 */
export function isDateInRange(date: Date, startDateString: string, endDateString: string): boolean {
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  
  const startDate = new Date(startDateString + "T00:00:00");
  const endDate = new Date(endDateString + "T00:00:00");
  
  return checkDate >= startDate && checkDate <= endDate;
}

/**
 * Check if a date matches a date string (YYYY-MM-DD)
 */
export function isSameDate(date: Date, dateString: string): boolean {
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  const compareDate = new Date(dateString + "T00:00:00");
  return checkDate.getTime() === compareDate.getTime();
}

/**
 * Convert a Date to YYYY-MM-DD string
 */
export function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export interface CalendarDay {
  date: Date | null;
  wordsWritten: number;
  goal: number | null;
  isToday: boolean;
  isFuture: boolean;
}

/**
 * Generate a month grid for calendar display
 * Returns an array of weeks, each week containing 7 days (Sun-Sat)
 * Empty cells are represented by null dates
 */
export function generateMonthGrid(
  year: number,
  month: number,
  writingSessions: WritingSession[],
  dailyGoal?: number
): CalendarDay[][] {
  const firstDayOfWeek = getFirstDayOfWeek(year, month);
  const daysInMonth = getDaysInMonth(year, month);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Create a map for quick lookup of writing sessions
  const sessionMap = new Map<string, number>();
  writingSessions.forEach((session) => {
    sessionMap.set(session.date, session.wordCount);
  });
  
  const weeks: CalendarDay[][] = [];
  let currentWeek: CalendarDay[] = [];
  
  // Add empty cells for days before the first of the month
  for (let i = 0; i < firstDayOfWeek; i++) {
    currentWeek.push({
      date: null,
      wordsWritten: 0,
      goal: null,
      isToday: false,
      isFuture: false,
    });
  }
  
  // Add all days in the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    date.setHours(0, 0, 0, 0);
    const dateString = toDateString(date);
    
    currentWeek.push({
      date,
      wordsWritten: sessionMap.get(dateString) || 0,
      goal: dailyGoal ?? null,
      isToday: date.getTime() === today.getTime(),
      isFuture: date > today,
    });
    
    // Start a new week on Sunday
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  
  // Fill the last week with empty cells if needed
  while (currentWeek.length > 0 && currentWeek.length < 7) {
    currentWeek.push({
      date: null,
      wordsWritten: 0,
      goal: null,
      isToday: false,
      isFuture: false,
    });
  }
  
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }
  
  return weeks;
}

/**
 * Get month name from month number (0-11)
 */
export function getMonthName(month: number): string {
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return monthNames[month];
}
