/**
 * Shared type definitions for the daily-write application
 */

export interface Goal {
  id: string;
  startDate: string; // YYYY-MM-DD format
  endDate: string; // YYYY-MM-DD format
  dailyWordTarget: number;
}

export interface WritingSession {
  date: string; // YYYY-MM-DD format
  wordCount: number;
}

export interface DayData {
  date: Date;
  wordsWritten: number;
  goal: number | null;
}

export interface CalendarDay {
  date: Date | null;
  wordsWritten: number;
  goal: number | null;
  isToday: boolean;
  isFuture: boolean;
}
