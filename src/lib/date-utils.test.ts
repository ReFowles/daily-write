import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  calculateDaysLeft,
  calculateWordCount,
  formatDate,
  formatDateRange,
  formatDayOfWeek,
  formatDistanceToNow,
  formatMonthDay,
  generateMonthGrid,
  generateWeekWindow,
  getDaysInMonth,
  getFirstDayOfMonth,
  getFirstDayOfWeek,
  getLastDayOfMonth,
  getMonthName,
  isDateInRange,
  isFuture,
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
});
