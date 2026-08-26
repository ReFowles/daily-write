import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardClient } from "./DashboardClient";
import type { Goal, WritingSession } from "@/lib/types";
import type { CurrentGoalData } from "@/lib/use-current-goal";

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: { user: { email: "a@b.com" } } }),
}));

vi.mock("@/lib/use-current-goal", () => ({
  useCurrentGoal: vi.fn(),
}));

// PageHeader renders a client-only <Link>, but we assert on its stat values.
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

import { useCurrentGoal } from "@/lib/use-current-goal";

const emptyStats = {
  totalWords: 0,
  totalDaysWritten: 0,
  averageWordsPerDay: 0,
  currentStreak: 0,
};

function setGoal(data: Partial<CurrentGoalData>) {
  vi.mocked(useCurrentGoal).mockReturnValue({
    todayGoal: 0,
    todayProgress: 0,
    daysLeft: 0,
    currentGoal: undefined,
    isLoading: false,
    ...data,
  });
}

describe("DashboardClient", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows remaining words when the daily goal is not yet met", () => {
    setGoal({ todayGoal: 500, todayProgress: 200 });
    render(<DashboardClient goals={[]} writingSessions={[]} stats={emptyStats} />);
    expect(screen.getByText(/300 words remaining/i)).toBeInTheDocument();
  });

  it("shows a celebration message when today's goal has been reached", () => {
    setGoal({ todayGoal: 500, todayProgress: 500 });
    render(<DashboardClient goals={[]} writingSessions={[]} stats={emptyStats} />);
    expect(screen.getByText(/goal achieved/i)).toBeInTheDocument();
  });

  it("renders four stats cards populated from the stats prop", () => {
    setGoal({ todayGoal: 100, todayProgress: 0 });
    render(
      <DashboardClient
        goals={[]}
        writingSessions={[]}
        stats={{
          totalWords: 12_345,
          totalDaysWritten: 7,
          averageWordsPerDay: 300,
          currentStreak: 3,
        }}
      />
    );

    expect(screen.getByText("Current Streak").nextElementSibling).toHaveTextContent("3");
    expect(screen.getByText("Total Days Written").nextElementSibling).toHaveTextContent("7");
    expect(screen.getByText("Avg Words/Session").nextElementSibling).toHaveTextContent("300");
    expect(screen.getByText("Total Words").nextElementSibling).toHaveTextContent("12345");
  });

  it("renders the ProgressCard fallback when no goal exists", () => {
    setGoal({ todayGoal: 0, todayProgress: 0 });
    render(<DashboardClient goals={[]} writingSessions={[]} stats={emptyStats} />);
    expect(screen.getByRole("link", { name: /create a goal/i })).toBeInTheDocument();
  });

  it("passes the current goal's date range down to PageHeader", () => {
    const goal: Goal = {
      id: "g1",
      userId: "u",
      startDate: "2026-01-01",
      endDate: "2026-01-31",
      dailyWordTarget: 500,
    };
    setGoal({
      todayGoal: 500,
      todayProgress: 0,
      daysLeft: 5,
      currentGoal: goal,
    });

    const sessions: WritingSession[] = [];
    render(<DashboardClient goals={[goal]} writingSessions={sessions} stats={emptyStats} />);

    // Rendered inside PageHeader's "Current" stat card.
    expect(screen.getByText(/1\/1 – 1\/31/)).toBeInTheDocument();
    expect(screen.getByText("Days Left").nextElementSibling).toHaveTextContent("5");
  });
});
