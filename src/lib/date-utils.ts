import type { DayData, WritingSession, CalendarDay, Goal } from "./types";

/**
 * Parse a date string (YYYY-MM-DD) into a Date object at local midnight
 * This avoids timezone issues by always treating dates as local
 */
export function parseLocalDate(dateString: string): Date {
  return new Date(dateString + "T00:00:00");
}

/**
 * Inclusive day count between two YYYY-MM-DD strings. Returns 0 if end < start
 * or either input is missing/invalid.
 */
export function daysBetweenInclusive(startDateString: string, endDateString: string): number {
  if (!startDateString || !endDateString) return 0;
  const start = parseLocalDate(startDateString);
  const end = parseLocalDate(endDateString);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  const ms = end.getTime() - start.getTime();
  if (ms < 0) return 0;
  return Math.round(ms / (1000 * 60 * 60 * 24)) + 1;
}

/**
 * Whether a goal treats a given date as a planned rest (exclusion) day.
 */
export function isExcludedDay(goal: Goal, dateString: string): boolean {
  return (goal.excludedDays ?? []).includes(dateString);
}

/**
 * Whether the writer has spent a cheat day on a given date.
 */
export function isCheatDay(goal: Goal, dateString: string): boolean {
  return (goal.cheatDaysUsed ?? []).includes(dateString);
}

/**
 * A day that expects no writing: either a planned exclusion day or a spent
 * cheat day. These never count toward pacing math or totals.
 */
export function isNonWritingDay(goal: Goal, dateString: string): boolean {
  return isExcludedDay(goal, dateString) || isCheatDay(goal, dateString);
}

/**
 * Whether the writer has chosen to rescue this deficit day with rolled-over
 * excess from another day in the goal.
 */
export function isRolloverDay(goal: Goal, dateString: string): boolean {
  return (goal.rolloverDays ?? []).includes(dateString);
}

/**
 * Per-day result of the rollover computation for a single goal.
 * - `rescued`: this deficit day was fully covered by rolled-over excess (renders green).
 * - `rolloverIn`: words pulled into a rescued day to close its gap.
 * - `excessLent`: how much of this surplus day's excess was consumed by a
 *   rescued day (the "counted down" amount).
 * - `canRescue`: this red day isn't rescued yet but enough unspent excess
 *   remains elsewhere in the goal to rescue it right now.
 */
export interface RolloverDayInfo {
  rescued: boolean;
  rolloverIn: number;
  excessLent: number;
  canRescue: boolean;
}

/**
 * Pools the excess from every surplus day in a goal and spends it to rescue the
 * deficit days the writer flagged. Excess can flow in either direction in time:
 * a later surplus day may rescue an earlier red day, which matters for live
 * goals where a slow start is made up later yet the early day still reads red.
 * The writer's chosen rescues are committed first (oldest deficit first, drawing
 * from the oldest excess first); a deficit is only rescued when enough unspent
 * excess exists to fully cover its gap.
 *
 * Returns a map keyed by YYYY-MM-DD for every evaluated day. Days not present in
 * the map (future days, rest/cheat days, days with no goal) have no rollover state.
 */
export function computeGoalRollover(
  goal: Goal,
  writingSessions: WritingSession[],
  todayDateString: string
): Map<string, RolloverDayInfo> {
  const result = new Map<string, RolloverDayInfo>();
  if (!goal.rollover) return result;

  const sessionMap = new Map<string, number>();
  writingSessions.forEach((session) => sessionMap.set(session.date, session.wordCount));

  const rescuedSet = new Set(goal.rolloverDays ?? []);
  const skipSet = new Set<string>([...(goal.excludedDays ?? []), ...(goal.cheatDaysUsed ?? [])]);

  const start = parseLocalDate(goal.startDate);
  const end = parseLocalDate(goal.endDate);
  const today = parseLocalDate(todayDateString);
  // Future days have no words to judge yet, so stop at the earlier of end/today.
  const lastDate = end < today ? end : today;

  // Every surplus day's unspent excess, oldest first, plus the deficit days.
  const pool: { date: string; remaining: number }[] = [];
  const deficits: { date: string; need: number }[] = [];

  for (
    let cursor = new Date(start);
    cursor.getTime() <= lastDate.getTime();
    cursor.setDate(cursor.getDate() + 1)
  ) {
    const dateString = toDateString(cursor);
    if (skipSet.has(dateString)) continue;

    const target = getEffectiveDailyTargetForDate(goal, dateString, writingSessions, todayDateString);
    if (target <= 0) continue;

    result.set(dateString, { rescued: false, rolloverIn: 0, excessLent: 0, canRescue: false });

    const words = sessionMap.get(dateString) ?? 0;
    const diff = words - target;
    if (diff > 0) {
      pool.push({ date: dateString, remaining: diff });
    } else if (diff < 0) {
      deficits.push({ date: dateString, need: -diff });
    }
  }

  const poolTotal = () => pool.reduce((sum, source) => sum + source.remaining, 0);

  const drawFromPool = (dateString: string, need: number) => {
    let toCover = need;
    for (const source of pool) {
      if (toCover <= 0) break;
      if (source.remaining <= 0) continue;
      const take = Math.min(source.remaining, toCover);
      source.remaining -= take;
      toCover -= take;
      const sourceInfo = result.get(source.date);
      if (sourceInfo) sourceInfo.excessLent += take;
    }
    const info = result.get(dateString);
    if (info) {
      info.rescued = true;
      info.rolloverIn = need;
    }
  };

  // Commit the writer's chosen rescues first, then flag which remaining red days
  // still have enough leftover excess to be rescued.
  for (const deficit of deficits) {
    if (rescuedSet.has(deficit.date) && poolTotal() >= deficit.need) {
      drawFromPool(deficit.date, deficit.need);
    }
  }

  for (const deficit of deficits) {
    if (rescuedSet.has(deficit.date)) continue;
    if (deficit.date === todayDateString) continue;
    const info = result.get(deficit.date);
    if (info && poolTotal() >= deficit.need) {
      info.canRescue = true;
    }
  }

  return result;
}

/**
 * Inclusive count of the writing days in [fromDateString, toDateString] for a
 * goal — i.e. days that are neither excluded nor spent as cheat days.
 */
export function countGoalWritingDays(
  goal: Goal,
  fromDateString: string,
  toDateString: string
): number {
  const from = parseLocalDate(fromDateString);
  const to = parseLocalDate(toDateString);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || to < from) return 0;

  const skip = new Set<string>([...(goal.excludedDays ?? []), ...(goal.cheatDaysUsed ?? [])]);

  let count = 0;
  for (
    let cursor = new Date(from);
    cursor.getTime() <= to.getTime();
    cursor.setDate(cursor.getDate() + 1)
  ) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(
      cursor.getDate()
    ).padStart(2, "0")}`;
    if (!skip.has(key)) count++;
  }
  return count;
}

/**
 * The goal's effective total word target. When cheatDaysReduceTotal is on,
 * each spent cheat day lowers the target by one daily target's worth so those
 * words don't have to be made up.
 */
export function getEffectiveTotalTarget(goal: Goal): number {
  if (!goal.cheatDaysReduceTotal) return goal.totalWordTarget;
  const used = (goal.cheatDaysUsed ?? []).length;
  return Math.max(0, goal.totalWordTarget - used * goal.dailyWordTarget);
}

/**
 * Effective daily target for a given goal on a given day. For "static" goals
 * this is just the stored daily target. For "live" goals it recomputes as
 * ceil(remainingWords / remainingWritingDays) so the user always has
 * a fresh number that would land them on the total by the end date. Excluded
 * and cheat days are dropped from the remaining-days denominator.
 */
export function getEffectiveDailyTarget(
  goal: Goal,
  todayDateString: string,
  wordsWrittenBeforeToday: number
): number {
  if (goal.mode === "static") return goal.dailyWordTarget;

  const today = parseLocalDate(todayDateString);
  const start = parseLocalDate(goal.startDate);
  const end = parseLocalDate(goal.endDate);

  if (today > end) return 0;
  // Before the goal has started, live goals fall back to the even split so
  // the header stat isn't misleadingly high.
  if (today < start) return goal.dailyWordTarget;

  const remainingWords = Math.max(0, getEffectiveTotalTarget(goal) - wordsWrittenBeforeToday);
  const remainingDays = Math.max(1, countGoalWritingDays(goal, todayDateString, goal.endDate));
  return Math.ceil(remainingWords / remainingDays);
}

/**
 * Effective daily target for a goal on a specific calendar date, deriving
 * wordsWrittenBeforeToday from the goal's own writing sessions so calendar
 * views stay in sync with live goals as days pass, not just the header stat.
 *
 * Past dates freeze at whatever target was in effect that day (based on
 * progress up to that point); today and future dates all share today's
 * recalculated target, since it only updates once per day as "today" advances.
 */
export function getEffectiveDailyTargetForDate(
  goal: Goal,
  dateString: string,
  writingSessions: WritingSession[],
  todayDateString: string
): number {
  if (goal.mode === "static") return goal.dailyWordTarget;

  const referenceDate = dateString < todayDateString ? dateString : todayDateString;
  const cheatDays = new Set(goal.cheatDaysUsed ?? []);
  const wordsWrittenBeforeDate = writingSessions
    .filter(
      (session) =>
        session.date >= goal.startDate &&
        session.date < referenceDate &&
        !cheatDays.has(session.date)
    )
    .reduce((sum, session) => sum + session.wordCount, 0);

  return getEffectiveDailyTarget(goal, referenceDate, wordsWrittenBeforeDate);
}

/**
 * Generate a 5-day window of day data (2 days before, today, 2 days after)
 */
export function generateWeekWindow(
  goals: Goal[],
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
  const todayDateString = toDateString(today);
  // Rollover maps are per-goal and span the whole goal, so compute once and reuse.
  const rolloverByGoal = new Map<string, Map<string, RolloverDayInfo>>();
  const getRolloverInfo = (goal: Goal, dateString: string): RolloverDayInfo | undefined => {
    if (!goal.rollover) return undefined;
    let map = rolloverByGoal.get(goal.id);
    if (!map) {
      map = computeGoalRollover(goal, writingSessions, todayDateString);
      rolloverByGoal.set(goal.id, map);
    }
    return map.get(dateString);
  };
  for (let i = -2; i <= 2; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dateString = toDateString(date);
    
    // Find goal for this specific date
    const goal = goals.find(g => isDateInRange(date, g.startDate, g.endDate));

    const excluded = goal ? isExcludedDay(goal, dateString) : false;
    const cheatDay = goal ? isCheatDay(goal, dateString) : false;
    const cheatRemaining = goal
      ? (goal.cheatDaysAllowed ?? 0) - (goal.cheatDaysUsed ?? []).length
      : 0;
    const rollover = goal ? getRolloverInfo(goal, dateString) : undefined;

    days.push({
      date,
      wordsWritten: sessionMap.get(dateString) || 0,
      goal: goal ? getEffectiveDailyTargetForDate(goal, dateString, writingSessions, todayDateString) : null,
      casual: goal?.casual ?? false,
      goalId: goal?.id ?? null,
      excluded,
      cheatDay,
      canToggleCheat: !!goal && (cheatDay || cheatRemaining > 0),
      rolloverEnabled: goal?.rollover ?? false,
      rescued: rollover?.rescued ?? false,
      rolloverIn: rollover?.rolloverIn ?? 0,
      excessLent: rollover?.excessLent ?? 0,
      canRollover: rollover?.canRescue ?? false,
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
  const date = parseLocalDate(dateString);
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
  const endDate = parseLocalDate(endDateString);
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
  
  const startDate = parseLocalDate(startDateString);
  const endDate = parseLocalDate(endDateString);
  
  return checkDate >= startDate && checkDate <= endDate;
}

/**
 * Check if a date matches a date string (YYYY-MM-DD)
 */
export function isSameDate(date: Date, dateString: string): boolean {
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  const compareDate = parseLocalDate(dateString);
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

/**
 * Format a date to show the day of week (e.g., "Mon", "Tue")
 */
export function formatDayOfWeek(date: Date): string {
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

/**
 * Format a date to show month/day (e.g., "1/15")
 */
export function formatMonthDay(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

/**
 * Format a date range from two date strings (YYYY-MM-DD format)
 * Returns a readable range like "1/15 – 1/20" or just "1/15" if same date
 */
export function formatDateRange(startDateString: string, endDateString: string): string {
  const start = parseLocalDate(startDateString);
  const end = parseLocalDate(endDateString);
  
  const startFormatted = formatMonthDay(start);
  const endFormatted = formatMonthDay(end);
  
  // If start and end are the same, only show one date
  if (startFormatted === endFormatted) {
    return startFormatted;
  }
  
  return `${startFormatted} – ${endFormatted}`;
}

/**
 * Calculate word count from markdown text
 * Strips markdown syntax and counts actual words
 */
export function calculateWordCount(markdown: string): number {
  const plainText = markdown
    .replace(/[#*_~`\[\]()]/g, '') // Remove markdown chars
    .replace(/!\[.*?\]\(.*?\)/g, '') // Remove images
    .replace(/\[.*?\]\(.*?\)/g, '') // Remove links
    .trim();
  
  const words = plainText.split(/\s+/).filter((word: string) => word.length > 0);
  return words.length;
}

/**
 * Format a date as relative time (e.g., "2 hours ago", "yesterday")
 */
export function formatDistanceToNow(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSecs < 60) {
    return 'just now';
  } else if (diffMins < 60) {
    return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
