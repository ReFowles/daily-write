import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MonthlyCalendar } from "./MonthlyCalendar";

describe("MonthlyCalendar", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 15, 10, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders day-of-week column headers and a monthly grid", () => {
    render(<MonthlyCalendar goals={[]} writingSessions={[]} />);
    for (const day of ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]) {
      expect(screen.getByRole("columnheader", { name: day })).toBeInTheDocument();
    }
    expect(screen.getByRole("grid", { name: /monthly calendar view/i })).toBeInTheDocument();
  });

  it("renders one gridcell per day in the month", () => {
    render(<MonthlyCalendar goals={[]} writingSessions={[]} />);
    // June 2026 has 30 days.
    const nonEmpty = screen
      .getAllByRole("gridcell")
      .filter((cell) => cell.getAttribute("aria-label") !== null);
    expect(nonEmpty).toHaveLength(30);
  });
});
