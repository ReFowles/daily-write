/**
 * Shared type definitions for the daily-write application
 */

export type { DocumentContent } from "./document-content";
export type { RolloverDayInfo } from "./date-utils";

/**
 * "static" locks the daily target chosen at creation time. "live" recomputes
 * today's daily target every day from the remaining total and remaining days.
 */
export type GoalMode = "live" | "static";

/**
 * "writing" goals track words written per day. "manual" goals track completion
 * of a user-defined unit (chapter, act, scene, …) via a hand-updated counter;
 * for them `dailyWordTarget`/`totalWordTarget` hold the daily/total unit counts.
 */
export type GoalKind = "writing" | "manual";

export interface Goal {
  id: string;
  userId: string;
  startDate: string; // YYYY-MM-DD format
  endDate: string; // YYYY-MM-DD format
  dailyWordTarget: number;
  totalWordTarget: number;
  mode: GoalMode;
  // What the goal tracks. Absent/legacy docs are treated as "writing".
  kind?: GoalKind;
  // Manual goals only: the unit the writer counts (e.g. "chapter").
  unitLabel?: string;
  // Manual goals only: how many units the writer has marked complete.
  completedUnits?: number;
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
  // When true, excess words from earlier surplus days can be "rolled" forward
  // to cover a later day's shortfall, turning a red day green.
  rollover?: boolean;
  // Deficit days (YYYY-MM-DD) the writer chose to rescue with rolled-over
  // excess from earlier days.
  rolloverDays?: string[];
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
  // Set for days governed by a manual goal; names the unit shown in the
  // calendar denominator (e.g. "chapter"). Null for writing-goal days.
  unitLabel: string | null;
  excluded: boolean;
  cheatDay: boolean;
  canToggleCheat: boolean;
  // Rollover state (see computeGoalRollover). rolloverEnabled mirrors the goal
  // flag; the rest describe this specific day.
  rolloverEnabled: boolean;
  rescued: boolean;
  rolloverIn: number;
  excessLent: number;
  canRollover: boolean;
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
