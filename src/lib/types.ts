/**
 * Shared type definitions for the daily-write application
 */

export interface Goal {
  id: string;
  userId: string;
  startDate: string; // YYYY-MM-DD format
  endDate: string; // YYYY-MM-DD format
  dailyWordTarget: number;
}

export interface WritingSession {
  userId: string;
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

export interface GoogleDoc {
  id: string;
  name: string;
  modifiedTime: string;
  webViewLink: string;
  ownedByMe: boolean;
}
