import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

const useSessionMock = vi.fn();
vi.mock("next-auth/react", () => ({
  useSession: () => useSessionMock(),
}));

import { PageHeader } from "./PageHeader";

describe("PageHeader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSessionMock.mockReturnValue({ data: { user: { email: "user@example.com" } } });
  });

  it("renders stats cards when signed in and hideStats is not set", () => {
    render(
      <PageHeader
        title="Write"
        description="desc"
        dailyGoal={500}
        daysLeft={7}
        writtenToday={200}
        goalStartDate="2026-06-01"
        goalEndDate="2026-06-30"
      />
    );

    expect(screen.getByText("Today")).toBeInTheDocument();
    expect(screen.getByText("Goal")).toBeInTheDocument();
    expect(screen.getByText("Current")).toBeInTheDocument();
    expect(screen.getByText("Days Left")).toBeInTheDocument();
    expect(screen.getByText("200")).toBeInTheDocument();
    expect(screen.getByText("500")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
  });

  it("hides stats cards when hideStats is true", () => {
    render(
      <PageHeader
        title="Write"
        description="desc"
        dailyGoal={500}
        daysLeft={7}
        writtenToday={200}
        goalStartDate="2026-06-01"
        goalEndDate="2026-06-30"
        hideStats
      />
    );

    expect(screen.queryByText("Today")).not.toBeInTheDocument();
    expect(screen.queryByText("Goal")).not.toBeInTheDocument();
    expect(screen.queryByText("Current")).not.toBeInTheDocument();
    expect(screen.queryByText("Days Left")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Write" })).toBeInTheDocument();
    expect(screen.getByText("desc")).toBeInTheDocument();
  });

  it("renders a description ReactNode (e.g. an inline action button)", () => {
    render(
      <PageHeader
        title="Goals"
        description={
          <>
            <button type="button">New Goal</button>
          </>
        }
      />
    );

    expect(screen.getByRole("button", { name: /new goal/i })).toBeInTheDocument();
  });

  it("renders a manual goal's completion counter with working +/- controls", () => {
    const onIncrement = vi.fn();
    const onDecrement = vi.fn();
    render(
      <PageHeader
        title="Write"
        description="desc"
        daysLeft={7}
        goalStartDate="2026-06-01"
        goalEndDate="2026-06-30"
        manualGoal={{
          label: "chapter",
          completed: 3,
          total: 12,
          dailyTarget: 2,
          onIncrement,
          onDecrement,
        }}
      />
    );

    // Word-count cards are replaced by the unit counter (completed / daily) and
    // a Total card for the whole-goal target.
    expect(screen.queryByText("Today")).not.toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText(/\/\s*2/)).toBeInTheDocument();
    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.getByText(/12 chapters/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /increase chapter count/i }));
    expect(onIncrement).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: /decrease chapter count/i }));
    expect(onDecrement).toHaveBeenCalledTimes(1);
  });

  it("disables the manual counter controls at their bounds", () => {
    render(
      <PageHeader
        title="Write"
        description="desc"
        daysLeft={7}
        goalStartDate="2026-06-01"
        goalEndDate="2026-06-30"
        manualGoal={{
          label: "act",
          completed: 0,
          total: 3,
          dailyTarget: 1,
          onIncrement: vi.fn(),
          onDecrement: vi.fn(),
        }}
      />
    );

    expect(screen.getByRole("button", { name: /decrease act count/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /increase act count/i })).not.toBeDisabled();
  });

  it("pluralizes the counter card's label off the daily target, not the completed count", () => {
    render(
      <PageHeader
        title="Write"
        description="desc"
        daysLeft={7}
        goalStartDate="2026-06-01"
        goalEndDate="2026-06-30"
        manualGoal={{
          label: "chapter",
          completed: 3,
          total: 12,
          dailyTarget: 1,
          onIncrement: vi.fn(),
          onDecrement: vi.fn(),
        }}
      />
    );

    expect(screen.getByText(/^chapter$/i)).toBeInTheDocument();
    expect(screen.queryByText(/^chapters$/i)).not.toBeInTheDocument();
  });
});
