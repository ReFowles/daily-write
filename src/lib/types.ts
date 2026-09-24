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
  // Casual goals don't flag zero-word days red in the calendars.
  casual: boolean;
  // Planned rest days (YYYY-MM-DD) chosen at creation. They expect no writing,
  // don't count toward live pacing or the total estimate, and render gray.
  excludedDays?: string[];
  // How many cheat days the writer may spend during this goal.
  cheatDaysAllowed?: number;
  // Days (YYYY-MM-DD) the writer spent a cheat day on. These never count.
  cheatDaysUsed?: string[];
  // When true, each spent cheat day lowers the goal total by one daily target
  // so the writer doesn't have to make those words up elsewhere.
  cheatDaysReduceTotal?: boolean;
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
  casual: boolean;
  goalId: string | null;
  excluded: boolean;
  cheatDay: boolean;
  canToggleCheat: boolean;
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
