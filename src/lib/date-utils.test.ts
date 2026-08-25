import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  calculateDaysLeft,
  formatDate,
  isDateInRange,
  isFuture,
  isSameDate,
  isToday,
  parseLocalDate,
  toDateString,
} from "./date-utils";

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
});
