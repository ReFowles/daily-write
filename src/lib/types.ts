/**
 * Shared type definitions for the daily-write application
 */

export type { DocumentContent } from "./document-content";

/**
 * "static" locks the daily target chosen at creation time. "live" recomputes
 * today's daily target every day from the remaining total and remaining days.
 */
export type GoalMode = "live" | "static";

export interface Goal {
  id: string;
  userId: string;
  startDate: string; // YYYY-MM-DD format
  endDate: string; // YYYY-MM-DD format
  dailyWordTarget: number;
  totalWordTarget: number;
  mode: GoalMode;
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
  // Human-readable Drive location (e.g. "My Drive / Writing / Novels"). Omitted
  // if the folder chain could not be resolved.
  path?: string;
}

export interface DocFavorite {
  userId: string;
  docId: string;
}

export interface DocumentTab {
  tabId: string;
  title: string;
  index: number;
  nestingLevel: number;
  parentTabId?: string;
}
