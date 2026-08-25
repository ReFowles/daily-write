import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCalendarNavigation } from "./use-calendar-navigation";

describe("useCalendarNavigation", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 15));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("defaults to the current month/year", () => {
    const { result } = renderHook(() => useCalendarNavigation());
    expect(result.current.year).toBe(2026);
    expect(result.current.month).toBe(5);
  });

  it("accepts initial year/month overrides", () => {
    const { result } = renderHook(() => useCalendarNavigation(2020, 0));
    expect(result.current.year).toBe(2020);
    expect(result.current.month).toBe(0);
  });

  it("goToNextMonth advances month and rolls year at December", () => {
    const { result } = renderHook(() => useCalendarNavigation(2026, 11));
    act(() => result.current.goToNextMonth());
    expect(result.current.year).toBe(2027);
    expect(result.current.month).toBe(0);
  });

  it("goToPreviousMonth rolls year at January", () => {
    const { result } = renderHook(() => useCalendarNavigation(2026, 0));
    act(() => result.current.goToPreviousMonth());
    expect(result.current.year).toBe(2025);
    expect(result.current.month).toBe(11);
  });

  it("goToToday resets to current month/year", () => {
    const { result } = renderHook(() => useCalendarNavigation(2020, 3));
    act(() => result.current.goToToday());
    expect(result.current.year).toBe(2026);
    expect(result.current.month).toBe(5);
  });
});
