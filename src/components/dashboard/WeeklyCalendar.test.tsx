import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WeeklyCalendar } from "./WeeklyCalendar";
import type { Goal, WritingSession } from "@/lib/types";

describe("WeeklyCalendar", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 15, 10, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders 5 DayCard cells with heading", () => {
    render(<WeeklyCalendar goals={[]} writingSessions={[]} />);
    expect(screen.getByRole("heading", { name: /this week/i })).toBeInTheDocument();
    expect(screen.getAllByRole("gridcell")).toHaveLength(5);
  });

  it("attaches session word counts to the center cell", () => {
    const goals: Goal[] = [
      {
        id: "g1",
        userId: "u1",
        startDate: "2026-06-01",
        endDate: "2026-06-30",
        dailyWordTarget: 500,
        totalWordTarget: 15000,
        mode: "static",
      },
    ];
    const sessions: WritingSession[] = [
      { userId: "u1", date: "2026-06-15", wordCount: 250 },
    ];
    render(<WeeklyCalendar goals={goals} writingSessions={sessions} />);
    const todayCell = screen
      .getAllByRole("gridcell")
      .find((cell) => cell.getAttribute("aria-label")?.includes("June 15"));
    expect(todayCell).toBeDefined();
    expect(todayCell?.getAttribute("aria-label")).toContain("written: 250 words");
    expect(todayCell?.getAttribute("aria-label")).toContain("goal: 500 words");
  });
});
