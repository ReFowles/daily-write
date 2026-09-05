import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GoalsPageClient } from "./GoalsPageClient";
import type { Goal, WritingSession } from "@/lib/types";
import type { CurrentGoalData } from "@/lib/use-current-goal";

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: { user: { email: "u@example.com" } } }),
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/use-current-goal", () => ({
  useCurrentGoal: (): CurrentGoalData => ({
    todayGoal: 0,
    todayProgress: 0,
    daysLeft: 0,
    currentGoal: undefined,
    isLoading: false,
  }),
}));

vi.mock("@/lib/data-store", () => ({
  getAllGoals: vi.fn(),
  getAllWritingSessions: vi.fn(),
  createGoal: vi.fn(),
  deleteGoal: vi.fn(),
}));

// MonthlyCalendar is heavy and unrelated to the logic under test.
vi.mock("@/components/goals/MonthlyCalendar", () => ({
  MonthlyCalendar: () => null,
}));

import {
  createGoal,
  deleteGoal,
  getAllGoals,
  getAllWritingSessions,
} from "@/lib/data-store";

const makeGoal = (over: Partial<Goal> = {}): Goal => ({
  id: "g",
  userId: "u@example.com",
  startDate: "2026-01-01",
  endDate: "2026-01-31",
  dailyWordTarget: 500,
  totalWordTarget: 15500,
  mode: "static",
  ...over,
});

async function renderWithGoals(goals: Goal[], sessions: WritingSession[] = []) {
  vi.mocked(getAllGoals).mockResolvedValueOnce(goals);
  vi.mocked(getAllWritingSessions).mockResolvedValueOnce(sessions);
  const utils = render(<GoalsPageClient userId="u@example.com" />);
  await waitFor(() => {
    expect(screen.queryByText(/loading goals/i)).not.toBeInTheDocument();
  });
  return utils;
}

describe("GoalsPageClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-06-15T12:00:00Z"));
  });

  it("shows the empty state when the user has no goals", async () => {
    await renderWithGoals([]);
    expect(screen.getByRole("heading", { name: /no goals yet/i })).toBeInTheDocument();
  });

  it("puts each goal into the correct bucket based on today's date", async () => {
    const current = makeGoal({ id: "c", startDate: "2026-06-01", endDate: "2026-06-30" });
    const upcoming = makeGoal({ id: "u", startDate: "2026-07-01", endDate: "2026-07-31" });
    const completed = makeGoal({ id: "p", startDate: "2026-05-01", endDate: "2026-05-31" });

    await renderWithGoals([completed, upcoming, current]);

    expect(screen.getByRole("heading", { name: /^current goal$/i })).toBeInTheDocument();
    // Both toggle sections default to expanded, so the button aria-label is "Collapse …".
    expect(
      screen.getByRole("button", { name: /collapse completed goals/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /collapse upcoming goals/i })
    ).toBeInTheDocument();
    // One card per bucket → three <h3> date range headings total.
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(3);
  });

  it("rejects overlapping goals via the error callback", async () => {
    const existing = makeGoal({
      id: "existing",
      startDate: "2026-06-01",
      endDate: "2026-06-30",
    });
    await renderWithGoals([existing]);

    fireEvent.click(screen.getByRole("button", { name: /^new goal$/i }));

    fireEvent.change(screen.getByLabelText(/start date/i), {
      target: { value: "2026-06-15" },
    });
    fireEvent.change(screen.getByLabelText(/end date/i), {
      target: { value: "2026-07-15" },
    });
    fireEvent.change(screen.getByLabelText(/daily target/i), {
      target: { value: "500" },
    });

    fireEvent.click(screen.getByRole("button", { name: /^create goal$/i }));

    await waitFor(() => {
      expect(screen.getByText(/overlaps with an existing goal/i)).toBeInTheDocument();
    });
    expect(createGoal).not.toHaveBeenCalled();
  });

  it("creates a non-overlapping goal and prepends it to the list", async () => {
    const existing = makeGoal({
      id: "existing",
      startDate: "2026-06-01",
      endDate: "2026-06-30",
    });
    await renderWithGoals([existing]);

    const newGoal = makeGoal({
      id: "new",
      startDate: "2026-08-01",
      endDate: "2026-08-31",
    });
    vi.mocked(createGoal).mockResolvedValueOnce(newGoal);

    fireEvent.click(screen.getByRole("button", { name: /^new goal$/i }));

    fireEvent.change(screen.getByLabelText(/start date/i), {
      target: { value: newGoal.startDate },
    });
    fireEvent.change(screen.getByLabelText(/end date/i), {
      target: { value: newGoal.endDate },
    });
    fireEvent.change(screen.getByLabelText(/daily target/i), {
      target: { value: "500" },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /^create goal$/i }));
    });

    expect(createGoal).toHaveBeenCalledWith(
      expect.objectContaining({
        startDate: newGoal.startDate,
        endDate: newGoal.endDate,
        dailyWordTarget: 500,
        userId: "u@example.com",
      })
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /collapse upcoming goals/i })
      ).toBeInTheDocument();
    });
  });

  it("deletes a goal from the list on confirmation", async () => {
    const g = makeGoal({ id: "past", startDate: "2026-05-01", endDate: "2026-05-31" });
    vi.mocked(deleteGoal).mockResolvedValueOnce();
    await renderWithGoals([g]);

    // Section is already expanded; delete the only rendered goal card.
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /delete goal/i }));
    });

    expect(deleteGoal).toHaveBeenCalledWith("past");
    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: /collapse completed goals/i })
      ).not.toBeInTheDocument();
    });
  });
});
