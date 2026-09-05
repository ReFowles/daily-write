import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { GoalCard } from "./GoalCard";
import type { Goal, WritingSession } from "@/lib/types";

const activeGoal: Goal = {
  id: "g1",
  userId: "u1",
  startDate: "2026-06-01",
  endDate: "2026-06-30",
  dailyWordTarget: 500,
  totalWordTarget: 15000,
  mode: "static",
};

const pastGoal: Goal = {
  id: "g2",
  userId: "u1",
  startDate: "2026-01-01",
  endDate: "2026-01-10",
  dailyWordTarget: 300,
  totalWordTarget: 3000,
  mode: "static",
};

describe("GoalCard", () => {
  it("renders progress toward the goal", () => {
    const sessions: WritingSession[] = [
      { userId: "u1", date: "2026-06-01", wordCount: 500 },
      { userId: "u1", date: "2026-06-02", wordCount: 500 },
    ];
    render(<GoalCard goal={activeGoal} writingSessions={sessions} onDelete={vi.fn()} />);
    // Words written / target total (500/day * 30 days = 15000).
    expect(screen.getByText(/1,000\s*\/\s*15,000/)).toBeInTheDocument();
    expect(screen.getByText(/500 words\/day for 30 days/)).toBeInTheDocument();
  });

  it("calls onDelete with the goal id when the delete button is clicked", () => {
    const onDelete = vi.fn();
    render(<GoalCard goal={activeGoal} writingSessions={[]} onDelete={onDelete} />);
    fireEvent.click(screen.getByRole("button", { name: /delete goal/i }));
    expect(onDelete).toHaveBeenCalledWith("g1");
  });

  it("marks a completed goal as met when progress hits 100%", () => {
    // 300 words/day * 10 days = 3000 target. Provide 3000+ words.
    const sessions: WritingSession[] = Array.from({ length: 10 }, (_, i) => ({
      userId: "u1",
      date: `2026-01-${String(i + 1).padStart(2, "0")}`,
      wordCount: 300,
    }));
    render(<GoalCard goal={pastGoal} writingSessions={sessions} onDelete={vi.fn()} />);
    expect(screen.getByText(/goal met/i)).toBeInTheDocument();
  });

  it("marks a completed goal as not met when target isn't reached", () => {
    render(<GoalCard goal={pastGoal} writingSessions={[]} onDelete={vi.fn()} />);
    expect(screen.getByText(/goal not met/i)).toBeInTheDocument();
  });

  it("toggles the logged-days section", () => {
    const sessions: WritingSession[] = [
      { userId: "u1", date: "2026-06-05", wordCount: 400 },
    ];
    render(<GoalCard goal={activeGoal} writingSessions={sessions} onDelete={vi.fn()} />);
    // activeGoal spans 30 days, all of which are prior to the current test date,
    // so every day is shown — even ones with 0 words.
    const toggle = screen.getByRole("button", { name: /logged days \(30\)/i });
    // Collapsed by default: date chip is not visible.
    expect(screen.queryByText("Jun 5, 2026")).not.toBeInTheDocument();
    fireEvent.click(toggle);
    expect(screen.getByText("Jun 5, 2026")).toBeInTheDocument();
    expect(screen.getByText(/400 words/)).toBeInTheDocument();
    // A day with no session shows up as 0 words.
    expect(screen.getByText("Jun 1, 2026")).toBeInTheDocument();
    expect(screen.getAllByText(/0 words/).length).toBeGreaterThan(0);
  });
});
