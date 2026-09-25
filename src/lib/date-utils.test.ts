import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  calculateDaysLeft,
  calculateWordCount,
  computeGoalRollover,
  countGoalWritingDays,
  daysBetweenInclusive,
  formatDate,
  formatDateRange,
  formatDayOfWeek,
  formatDistanceToNow,
  formatMonthDay,
  generateMonthGrid,
  generateWeekWindow,
  getDaysInMonth,
  getEffectiveDailyTarget,
  getEffectiveDailyTargetForDate,
  getEffectiveTotalTarget,
  getFirstDayOfMonth,
  getFirstDayOfWeek,
  getLastDayOfMonth,
  getMonthName,
  isCheatDay,
  isDateInRange,
  isExcludedDay,
  isFuture,
  isNonWritingDay,
  isSameDate,
  isToday,
  parseLocalDate,
  toDateString,
} from "./date-utils";
import type { Goal, WritingSession } from "./types";

describe("date-utils", () => {
  describe("toDateString", () => {
    it("formats a date as YYYY-MM-DD in local time", () => {
      const date = new Date(2026, 0, 5);
      expect(toDateString(date)).toBe("2026-01-05");
    });

    it("zero-pads month and day", () => {
      const date = new Date(2026, 8, 9);
      expect(toDateString(date)).toBe("2026-09-09");
    });

    it("round-trips with parseLocalDate", () => {
      const original = "2026-03-14";
      expect(toDateString(parseLocalDate(original))).toBe(original);
    });
  });

  describe("parseLocalDate", () => {
    it("parses a YYYY-MM-DD string at local midnight", () => {
      const parsed = parseLocalDate("2026-06-15");
      expect(parsed.getFullYear()).toBe(2026);
      expect(parsed.getMonth()).toBe(5);
      expect(parsed.getDate()).toBe(15);
      expect(parsed.getHours()).toBe(0);
    });
  });

  describe("formatDate", () => {
    it("returns a human-readable date string", () => {
      expect(formatDate("2026-01-05")).toBe("Jan 5, 2026");
    });
  });

  describe("isDateInRange", () => {
    it("is inclusive of both endpoints", () => {
      const start = "2026-01-01";
      const end = "2026-01-31";
      expect(isDateInRange(parseLocalDate(start), start, end)).toBe(true);
      expect(isDateInRange(parseLocalDate(end), start, end)).toBe(true);
    });

    it("returns false for dates outside the range", () => {
      expect(isDateInRange(parseLocalDate("2025-12-31"), "2026-01-01", "2026-01-31")).toBe(false);
      expect(isDateInRange(parseLocalDate("2026-02-01"), "2026-01-01", "2026-01-31")).toBe(false);
    });
  });

  describe("isSameDate", () => {
    it("returns true regardless of time-of-day on the Date input", () => {
      const date = new Date(2026, 5, 15, 14, 30);
      expect(isSameDate(date, "2026-06-15")).toBe(true);
    });

    it("returns false for different days", () => {
      expect(isSameDate(new Date(2026, 5, 15), "2026-06-16")).toBe(false);
    });
  });

  describe("today-relative helpers", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 5, 15, 10, 0, 0));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("isToday matches the current calendar day", () => {
      expect(isToday(new Date(2026, 5, 15))).toBe(true);
      expect(isToday(new Date(2026, 5, 14))).toBe(false);
    });

    it("isFuture returns true only for days after today", () => {
      expect(isFuture(new Date(2026, 5, 16))).toBe(true);
      expect(isFuture(new Date(2026, 5, 15))).toBe(false);
      expect(isFuture(new Date(2026, 5, 14))).toBe(false);
    });

    it("calculateDaysLeft counts remaining days to the goal end date", () => {
      expect(calculateDaysLeft("2026-06-20")).toBe(5);
      expect(calculateDaysLeft("2026-06-15")).toBe(0);
      expect(calculateDaysLeft("2026-06-10")).toBe(-5);
    });
  });

  describe("daysBetweenInclusive", () => {
    it("counts both endpoints", () => {
      expect(daysBetweenInclusive("2026-06-01", "2026-06-30")).toBe(30);
      expect(daysBetweenInclusive("2026-06-01", "2026-06-01")).toBe(1);
    });

    it("returns 0 for reversed or missing ranges", () => {
      expect(daysBetweenInclusive("2026-06-30", "2026-06-01")).toBe(0);
      expect(daysBetweenInclusive("", "2026-06-01")).toBe(0);
      expect(daysBetweenInclusive("2026-06-01", "")).toBe(0);
    });
  });

  describe("getEffectiveDailyTarget", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 5, 15));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    const baseGoal: Goal = {
      id: "g",
      userId: "u",
      startDate: "2026-06-01",
      endDate: "2026-06-30",
      dailyWordTarget: 500,
      totalWordTarget: 15000,
      mode: "static",
      casual: false,
    };

    it("returns the stored daily target for static goals", () => {
      expect(getEffectiveDailyTarget(baseGoal, "2026-06-15", 3000)).toBe(500);
    });

    it("recomputes for live goals from remaining words / remaining days", () => {
      const live: Goal = { ...baseGoal, mode: "live" };
      // 15000 - 3000 = 12000 remaining; 2026-06-15 through 2026-06-30 = 16 days.
      expect(getEffectiveDailyTarget(live, "2026-06-15", 3000)).toBe(750);
    });

    it("returns 0 for live goals whose end date has passed", () => {
      const live: Goal = { ...baseGoal, mode: "live" };
      expect(getEffectiveDailyTarget(live, "2026-07-01", 0)).toBe(0);
    });

    it("clamps live remaining words at 0 when the user overshoots", () => {
      const live: Goal = { ...baseGoal, mode: "live" };
      expect(getEffectiveDailyTarget(live, "2026-06-15", 20000)).toBe(0);
    });

    it("spreads a live target over fewer days when rest days remain", () => {
      // 16 calendar days remain (06-15..06-30); excluding two future rest days
      // leaves 14 writing days. 12000 / 14 = 858 (rounded up).
      const live: Goal = {
        ...baseGoal,
        mode: "live",
        excludedDays: ["2026-06-20", "2026-06-21"],
      };
      expect(getEffectiveDailyTarget(live, "2026-06-15", 3000)).toBe(Math.ceil(12000 / 14));
    });

    it("drops spent cheat days from the live remaining-days denominator", () => {
      const live: Goal = {
        ...baseGoal,
        mode: "live",
        cheatDaysUsed: ["2026-06-18"],
      };
      // 15 writing days remain after removing one cheat day. 12000 / 15 = 800.
      expect(getEffectiveDailyTarget(live, "2026-06-15", 3000)).toBe(800);
    });

    it("lowers the live target when cheat days deduct from the total", () => {
      const live: Goal = {
        ...baseGoal,
        mode: "live",
        cheatDaysUsed: ["2026-06-18"],
        cheatDaysReduceTotal: true,
      };
      // Total drops by one daily target (15000 - 500 = 14500); remaining
      // 14500 - 3000 = 11500 over 15 writing days = ceil(766.67) = 767.
      expect(getEffectiveDailyTarget(live, "2026-06-15", 3000)).toBe(Math.ceil(11500 / 15));
    });
  });

  describe("getEffectiveTotalTarget", () => {
    const goal: Goal = {
      id: "g",
      userId: "u",
      startDate: "2026-06-01",
      endDate: "2026-06-30",
      dailyWordTarget: 500,
      totalWordTarget: 15000,
      mode: "static",
      casual: false,
      cheatDaysAllowed: 3,
      cheatDaysUsed: ["2026-06-05", "2026-06-06"],
    };

    it("returns the stored total when cheat days don't reduce it", () => {
      expect(getEffectiveTotalTarget(goal)).toBe(15000);
    });

    it("subtracts one daily target per spent cheat day when enabled", () => {
      expect(getEffectiveTotalTarget({ ...goal, cheatDaysReduceTotal: true })).toBe(14000);
    });

    it("never drops below 0", () => {
      const tiny: Goal = {
        ...goal,
        totalWordTarget: 400,
        cheatDaysReduceTotal: true,
      };
      expect(getEffectiveTotalTarget(tiny)).toBe(0);
    });
  });

  describe("rest and cheat day helpers", () => {
    const goal: Goal = {
      id: "g",
      userId: "u",
      startDate: "2026-06-01",
      endDate: "2026-06-10",
      dailyWordTarget: 100,
      totalWordTarget: 1000,
      mode: "static",
      casual: false,
      excludedDays: ["2026-06-03"],
      cheatDaysAllowed: 2,
      cheatDaysUsed: ["2026-06-05"],
    };

    it("identifies excluded, cheat, and non-writing days", () => {
      expect(isExcludedDay(goal, "2026-06-03")).toBe(true);
      expect(isExcludedDay(goal, "2026-06-04")).toBe(false);
      expect(isCheatDay(goal, "2026-06-05")).toBe(true);
      expect(isCheatDay(goal, "2026-06-03")).toBe(false);
      expect(isNonWritingDay(goal, "2026-06-03")).toBe(true);
      expect(isNonWritingDay(goal, "2026-06-05")).toBe(true);
      expect(isNonWritingDay(goal, "2026-06-06")).toBe(false);
    });

    it("counts only writing days in a range, excluding rest and cheat days", () => {
      // 06-01..06-10 is 10 days; minus one rest (06-03) and one cheat (06-05) = 8.
      expect(countGoalWritingDays(goal, "2026-06-01", "2026-06-10")).toBe(8);
    });

    it("returns 0 for an inverted range", () => {
      expect(countGoalWritingDays(goal, "2026-06-10", "2026-06-01")).toBe(0);
    });

    it("treats goals without rest/cheat data as all writing days", () => {
      const plain: Goal = { ...goal, excludedDays: undefined, cheatDaysUsed: undefined };
      expect(countGoalWritingDays(plain, "2026-06-01", "2026-06-10")).toBe(10);
    });
  });

  describe("getEffectiveDailyTargetForDate", () => {
    const live: Goal = {
      id: "g",
      userId: "u",
      startDate: "2026-06-01",
      endDate: "2026-06-04",
      dailyWordTarget: 50,
      totalWordTarget: 200,
      mode: "live",
      casual: false,
    };

    it("shows an even split across all days before any progress exists", () => {
      for (const date of ["2026-06-01", "2026-06-02", "2026-06-03", "2026-06-04"]) {
        expect(getEffectiveDailyTargetForDate(live, date, [], "2026-06-01")).toBe(50);
      }
    });

    it("freezes a past day's target at what it was when it was current, and shares today's recalculated target across today and future days", () => {
      // Day 1 (06-01) was completed with 80 words written; "today" is now day 2 (06-02).
      const sessions: WritingSession[] = [{ userId: "u", date: "2026-06-01", wordCount: 80 }];

      // Past day stays frozen at the original 50, regardless of the 80 actually written.
      expect(getEffectiveDailyTargetForDate(live, "2026-06-01", sessions, "2026-06-02")).toBe(50);

      // (200 - 80) / 3 remaining days = 40, shared by today and both future days.
      expect(getEffectiveDailyTargetForDate(live, "2026-06-02", sessions, "2026-06-02")).toBe(40);
      expect(getEffectiveDailyTargetForDate(live, "2026-06-03", sessions, "2026-06-02")).toBe(40);
      expect(getEffectiveDailyTargetForDate(live, "2026-06-04", sessions, "2026-06-02")).toBe(40);
    });

    it("recomputes again once another day passes", () => {
      // Day 2 (06-02) was completed with only 20 words; "today" is now day 3 (06-03).
      const sessions: WritingSession[] = [
        { userId: "u", date: "2026-06-01", wordCount: 80 },
        { userId: "u", date: "2026-06-02", wordCount: 20 },
      ];

      // Day 2 freezes at the 40 it showed when it was current.
      expect(getEffectiveDailyTargetForDate(live, "2026-06-02", sessions, "2026-06-03")).toBe(40);

      // (200 - 100) / 2 remaining days = 50, shared by today and the final day.
      expect(getEffectiveDailyTargetForDate(live, "2026-06-03", sessions, "2026-06-03")).toBe(50);
      expect(getEffectiveDailyTargetForDate(live, "2026-06-04", sessions, "2026-06-03")).toBe(50);
    });

    it("returns the stored daily target for static goals regardless of date", () => {
      const staticGoal: Goal = { ...live, mode: "static" };
      expect(getEffectiveDailyTargetForDate(staticGoal, "2026-06-04", [], "2026-06-02")).toBe(50);
    });

    it("recomputes a live manual goal from its completion counter, not sessions", () => {
      const manualLive: Goal = {
        ...live,
        kind: "manual",
        unitLabel: "chapter",
        totalWordTarget: 12,
        completedUnits: 4,
      };
      // Word sessions must be ignored; pacing uses completedUnits (4 of 12).
      const sessions: WritingSession[] = [{ userId: "u", date: "2026-06-01", wordCount: 999 }];
      // "today" is 06-02, so 3 writing days remain (06-02..06-04): ceil((12 - 4) / 3) = 3.
      expect(getEffectiveDailyTargetForDate(manualLive, "2026-06-02", sessions, "2026-06-02")).toBe(3);
    });
  });

  describe("month helpers", () => {
    it("getFirstDayOfMonth returns local day 1", () => {
      const d = getFirstDayOfMonth(2026, 1);
      expect(d.getFullYear()).toBe(2026);
      expect(d.getMonth()).toBe(1);
      expect(d.getDate()).toBe(1);
    });

    it("getLastDayOfMonth handles February leap years", () => {
      expect(getLastDayOfMonth(2024, 1).getDate()).toBe(29);
      expect(getLastDayOfMonth(2026, 1).getDate()).toBe(28);
      expect(getLastDayOfMonth(2026, 3).getDate()).toBe(30);
    });

    it("getDaysInMonth agrees with getLastDayOfMonth", () => {
      expect(getDaysInMonth(2026, 0)).toBe(31);
      expect(getDaysInMonth(2026, 1)).toBe(28);
      expect(getDaysInMonth(2024, 1)).toBe(29);
    });

    it("getFirstDayOfWeek returns 0..6 for Sun..Sat", () => {
      expect(getFirstDayOfWeek(2026, 0)).toBe(new Date(2026, 0, 1).getDay());
    });

    it("getMonthName returns the English name", () => {
      expect(getMonthName(0)).toBe("January");
      expect(getMonthName(11)).toBe("December");
    });
  });

  describe("formatting helpers", () => {
    it("formatDayOfWeek returns short weekday", () => {
      expect(formatDayOfWeek(new Date(2026, 5, 15))).toMatch(/^[A-Za-z]{3}$/);
    });

    it("formatMonthDay returns M/D", () => {
      expect(formatMonthDay(new Date(2026, 0, 5))).toBe("1/5");
      expect(formatMonthDay(new Date(2026, 11, 25))).toBe("12/25");
    });

    it("formatDateRange collapses same date", () => {
      expect(formatDateRange("2026-01-05", "2026-01-05")).toBe("1/5");
    });

    it("formatDateRange joins two dates with en-dash", () => {
      expect(formatDateRange("2026-01-05", "2026-01-20")).toBe("1/5 – 1/20");
    });
  });

  describe("calculateWordCount", () => {
    it("counts plain words", () => {
      expect(calculateWordCount("one two three")).toBe(3);
    });

    it("strips common markdown syntax", () => {
      expect(calculateWordCount("**bold** _italic_ `code`")).toBe(3);
      expect(calculateWordCount("# Heading here")).toBe(2);
    });

    it("returns 0 for empty input", () => {
      expect(calculateWordCount("")).toBe(0);
      expect(calculateWordCount("   ")).toBe(0);
    });
  });

  describe("formatDistanceToNow", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 5, 15, 12, 0, 0));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("returns 'just now' within a minute", () => {
      expect(formatDistanceToNow(new Date(2026, 5, 15, 11, 59, 30))).toBe("just now");
    });

    it("returns minutes for < 1 hour", () => {
      expect(formatDistanceToNow(new Date(2026, 5, 15, 11, 30, 0))).toBe("30 minutes ago");
      expect(formatDistanceToNow(new Date(2026, 5, 15, 11, 59, 0))).toBe("1 minute ago");
    });

    it("returns hours for < 24 hours", () => {
      expect(formatDistanceToNow(new Date(2026, 5, 15, 9, 0, 0))).toBe("3 hours ago");
      expect(formatDistanceToNow(new Date(2026, 5, 15, 11, 0, 0))).toBe("1 hour ago");
    });

    it("returns days for < 1 week", () => {
      expect(formatDistanceToNow(new Date(2026, 5, 13, 12, 0, 0))).toBe("2 days ago");
      expect(formatDistanceToNow(new Date(2026, 5, 14, 12, 0, 0))).toBe("1 day ago");
    });

    it("falls back to a formatted date after a week", () => {
      const result = formatDistanceToNow(new Date(2026, 4, 1, 12, 0, 0));
      expect(result).toMatch(/2026/);
    });
  });

  describe("generateWeekWindow", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 5, 15, 10, 0, 0));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("returns 5 days centered on today", () => {
      const days = generateWeekWindow([], []);
      expect(days).toHaveLength(5);
      expect(days[0].date.getDate()).toBe(13);
      expect(days[2].date.getDate()).toBe(15);
      expect(days[4].date.getDate()).toBe(17);
    });

    it("attaches session word counts and matching goal target", () => {
      const goals: Goal[] = [
        {
          id: "g1",
          userId: "u1",
          startDate: "2026-06-01",
          endDate: "2026-06-30",
          dailyWordTarget: 500,
          totalWordTarget: 15000,
          mode: "static",
          casual: false,
        },
      ];
      const sessions: WritingSession[] = [
        { userId: "u1", date: "2026-06-15", wordCount: 250 },
      ];
      const days = generateWeekWindow(goals, sessions);
      const today = days[2];
      expect(today.wordsWritten).toBe(250);
      expect(today.goal).toBe(500);
    });

    it("returns null goal for dates outside any goal range", () => {
      const days = generateWeekWindow([], []);
      expect(days.every((d) => d.goal === null)).toBe(true);
    });
  });

  describe("generateMonthGrid", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 5, 15, 10, 0, 0));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("produces weeks of 7 cells with correct leading padding", () => {
      const grid = generateMonthGrid(2026, 0, [], 300);
      expect(grid.every((week) => week.length === 7)).toBe(true);
      const firstDayOfWeek = new Date(2026, 0, 1).getDay();
      for (let i = 0; i < firstDayOfWeek; i++) {
        expect(grid[0][i].date).toBeNull();
      }
      const firstReal = grid[0][firstDayOfWeek];
      expect(firstReal.date?.getDate()).toBe(1);
      expect(firstReal.goal).toBe(300);
    });

    it("marks today with isToday and future days with isFuture", () => {
      const grid = generateMonthGrid(2026, 5, [], null as unknown as number);
      const flat = grid.flat().filter((d) => d.date !== null);
      const today = flat.find((d) => d.date?.getDate() === 15);
      const tomorrow = flat.find((d) => d.date?.getDate() === 16);
      const yesterday = flat.find((d) => d.date?.getDate() === 14);
      expect(today?.isToday).toBe(true);
      expect(tomorrow?.isFuture).toBe(true);
      expect(yesterday?.isFuture).toBe(false);
    });

    it("populates wordsWritten from sessions", () => {
      const sessions: WritingSession[] = [
        { userId: "u1", date: "2026-06-15", wordCount: 420 },
      ];
      const grid = generateMonthGrid(2026, 5, sessions);
      const today = grid.flat().find((d) => d.date?.getDate() === 15);
      expect(today?.wordsWritten).toBe(420);
    });
  });

  describe("computeGoalRollover", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 5, 15, 10, 0, 0));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    const rolloverGoal: Goal = {
      id: "g1",
      userId: "u1",
      startDate: "2026-06-01",
      endDate: "2026-06-30",
      dailyWordTarget: 500,
      totalWordTarget: 15000,
      mode: "static",
      casual: false,
      rollover: true,
    };

    it("returns an empty map when rollover is disabled", () => {
      const goal: Goal = { ...rolloverGoal, rollover: false };
      const sessions: WritingSession[] = [
        { userId: "u1", date: "2026-06-01", wordCount: 900 },
        { userId: "u1", date: "2026-06-02", wordCount: 100 },
      ];
      expect(computeGoalRollover(goal, sessions, "2026-06-15").size).toBe(0);
    });

    it("marks a flagged deficit day rescued and counts down the source's excess", () => {
      const goal: Goal = { ...rolloverGoal, rolloverDays: ["2026-06-02"] };
      const sessions: WritingSession[] = [
        { userId: "u1", date: "2026-06-01", wordCount: 900 }, // +400 excess
        { userId: "u1", date: "2026-06-02", wordCount: 100 }, // -400 deficit
      ];
      const map = computeGoalRollover(goal, sessions, "2026-06-15");
      expect(map.get("2026-06-02")?.rescued).toBe(true);
      expect(map.get("2026-06-02")?.rolloverIn).toBe(400);
      expect(map.get("2026-06-01")?.excessLent).toBe(400);
    });

    it("offers canRescue on an unflagged deficit day with enough banked excess", () => {
      const goal: Goal = { ...rolloverGoal, rolloverDays: [] };
      const sessions: WritingSession[] = [
        { userId: "u1", date: "2026-06-01", wordCount: 900 }, // +400 excess
        { userId: "u1", date: "2026-06-02", wordCount: 300 }, // -200 deficit
      ];
      const map = computeGoalRollover(goal, sessions, "2026-06-15");
      expect(map.get("2026-06-02")?.canRescue).toBe(true);
      expect(map.get("2026-06-02")?.rescued).toBe(false);
    });

    it("does not rescue when banked excess is insufficient", () => {
      const goal: Goal = { ...rolloverGoal, rolloverDays: ["2026-06-02"] };
      const sessions: WritingSession[] = [
        { userId: "u1", date: "2026-06-01", wordCount: 600 }, // +100 excess
        { userId: "u1", date: "2026-06-02", wordCount: 100 }, // -400 deficit
      ];
      const map = computeGoalRollover(goal, sessions, "2026-06-15");
      expect(map.get("2026-06-02")?.rescued).toBe(false);
      expect(map.get("2026-06-02")?.canRescue).toBe(false);
      // Untouched excess stays available on the source day.
      expect(map.get("2026-06-01")?.excessLent).toBe(0);
    });

    it("rescues an earlier red day using a later surplus day (live-goal case)", () => {
      const goal: Goal = { ...rolloverGoal, rolloverDays: ["2026-06-01"] };
      const sessions: WritingSession[] = [
        { userId: "u1", date: "2026-06-01", wordCount: 100 }, // -400 deficit
        { userId: "u1", date: "2026-06-02", wordCount: 900 }, // +400 excess (after)
      ];
      const map = computeGoalRollover(goal, sessions, "2026-06-15");
      expect(map.get("2026-06-01")?.rescued).toBe(true);
      expect(map.get("2026-06-01")?.rolloverIn).toBe(400);
      expect(map.get("2026-06-02")?.excessLent).toBe(400);
    });

    it("offers canRescue on an unflagged red day covered by a later surplus", () => {
      const goal: Goal = { ...rolloverGoal, rolloverDays: [] };
      const sessions: WritingSession[] = [
        { userId: "u1", date: "2026-06-01", wordCount: 300 }, // -200 deficit
        { userId: "u1", date: "2026-06-02", wordCount: 900 }, // +400 excess (after)
      ];
      const map = computeGoalRollover(goal, sessions, "2026-06-15");
      expect(map.get("2026-06-01")?.canRescue).toBe(true);
      expect(map.get("2026-06-01")?.rescued).toBe(false);
    });

    it("pulls from multiple surplus days oldest-first", () => {
      const goal: Goal = { ...rolloverGoal, rolloverDays: ["2026-06-03"] };
      const sessions: WritingSession[] = [
        { userId: "u1", date: "2026-06-01", wordCount: 700 }, // +200
        { userId: "u1", date: "2026-06-02", wordCount: 800 }, // +300
        { userId: "u1", date: "2026-06-03", wordCount: 100 }, // -400 deficit
      ];
      const map = computeGoalRollover(goal, sessions, "2026-06-15");
      expect(map.get("2026-06-03")?.rescued).toBe(true);
      expect(map.get("2026-06-01")?.excessLent).toBe(200); // fully drained first
      expect(map.get("2026-06-02")?.excessLent).toBe(200); // remainder from next
    });
  });
});
