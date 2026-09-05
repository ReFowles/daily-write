import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const useSessionMock = vi.fn();
vi.mock("next-auth/react", () => ({
  useSession: () => useSessionMock(),
}));

vi.mock("./data-store", () => ({
  getCurrentGoal: vi.fn(),
  getWritingSessionByDate: vi.fn(),
  getWritingSessionsInRange: vi.fn(),
}));

import { getCurrentGoal, getWritingSessionByDate, getWritingSessionsInRange } from "./data-store";
import { invalidateCurrentGoalCache, useCurrentGoal } from "./use-current-goal";

const getCurrentGoalMock = vi.mocked(getCurrentGoal);
const getSessionByDateMock = vi.mocked(getWritingSessionByDate);
const getSessionsInRangeMock = vi.mocked(getWritingSessionsInRange);

describe("useCurrentGoal", () => {
  beforeEach(() => {
    // Only fake Date so Testing Library's waitFor (which uses setTimeout) keeps working.
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 5, 15));
    vi.clearAllMocks();
    invalidateCurrentGoalCache();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns zeros and stops loading when there is no session", async () => {
    useSessionMock.mockReturnValue({ data: null });
    const { result } = renderHook(() => useCurrentGoal());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.todayGoal).toBe(0);
    expect(result.current.todayProgress).toBe(0);
    expect(result.current.currentGoal).toBeUndefined();
    expect(getCurrentGoalMock).not.toHaveBeenCalled();
  });

  it("fetches goal + today's session when signed in", async () => {
    useSessionMock.mockReturnValue({ data: { user: { email: "user@example.com" } } });
    getCurrentGoalMock.mockResolvedValueOnce({
      id: "g1",
      userId: "user@example.com",
      startDate: "2026-06-01",
      endDate: "2026-06-30",
      dailyWordTarget: 500,
      totalWordTarget: 15000,
      mode: "static",
    });
    getSessionByDateMock.mockResolvedValueOnce({
      userId: "user@example.com",
      date: "2026-06-15",
      wordCount: 200,
    });

    const { result } = renderHook(() => useCurrentGoal());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(getCurrentGoalMock).toHaveBeenCalledWith("user@example.com");
    expect(getSessionByDateMock).toHaveBeenCalledWith("user@example.com", "2026-06-15");
    expect(result.current.todayGoal).toBe(500);
    expect(result.current.todayProgress).toBe(200);
    expect(result.current.daysLeft).toBe(15);
    expect(result.current.currentGoal?.id).toBe("g1");
  });

  it("keeps todayProgress at 0 when today has no session yet", async () => {
    useSessionMock.mockReturnValue({ data: { user: { email: "user@example.com" } } });
    getCurrentGoalMock.mockResolvedValueOnce({
      id: "g1",
      userId: "user@example.com",
      startDate: "2026-06-01",
      endDate: "2026-06-30",
      dailyWordTarget: 500,
      totalWordTarget: 15000,
      mode: "static",
    });
    getSessionByDateMock.mockResolvedValueOnce(null);

    const { result } = renderHook(() => useCurrentGoal());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.todayProgress).toBe(0);
    expect(result.current.todayGoal).toBe(500);
  });

  it("swallows fetch errors and finishes loading", async () => {
    useSessionMock.mockReturnValue({ data: { user: { email: "user@example.com" } } });
    getCurrentGoalMock.mockRejectedValueOnce(new Error("boom"));
    getSessionByDateMock.mockResolvedValueOnce(null);
    vi.spyOn(console, "error").mockImplementation(() => {});

    const { result } = renderHook(() => useCurrentGoal());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.currentGoal).toBeUndefined();
    expect(result.current.todayGoal).toBe(0);
  });

  it("recalculates today's target for live goals from prior progress", async () => {
    useSessionMock.mockReturnValue({ data: { user: { email: "user@example.com" } } });
    // Live goal: 15000 total across 30 days. Today is 2026-06-15, so 16 days remain (incl. today).
    // Wrote 3000 words before today → remaining 12000 / 16 = 750 words today.
    getCurrentGoalMock.mockResolvedValueOnce({
      id: "g1",
      userId: "user@example.com",
      startDate: "2026-06-01",
      endDate: "2026-06-30",
      dailyWordTarget: 500,
      totalWordTarget: 15000,
      mode: "live",
    });
    getSessionByDateMock.mockResolvedValueOnce(null);
    getSessionsInRangeMock.mockResolvedValueOnce([
      { userId: "user@example.com", date: "2026-06-01", wordCount: 1000 },
      { userId: "user@example.com", date: "2026-06-02", wordCount: 2000 },
    ]);

    const { result } = renderHook(() => useCurrentGoal());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(getSessionsInRangeMock).toHaveBeenCalledWith(
      "user@example.com",
      "2026-06-01",
      "2026-06-15"
    );
    expect(result.current.todayGoal).toBe(750);
  });
});
