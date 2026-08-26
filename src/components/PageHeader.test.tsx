import { render, screen } from "@testing-library/react";
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

  it("renders `…` placeholders in goal-derived stat cards while isLoading", () => {
    render(
      <PageHeader
        title="Write"
        description="desc"
        dailyGoal={500}
        daysLeft={7}
        writtenToday={0}
        goalStartDate="2026-06-01"
        goalEndDate="2026-06-30"
        isLoading
      />
    );

    // Goal, Current, Days Left should all be placeholders while loading.
    expect(screen.getAllByText("\u2026")).toHaveLength(3);
    // The real goal value should not be rendered.
    expect(screen.queryByText("500")).not.toBeInTheDocument();
    expect(screen.queryByText("7")).not.toBeInTheDocument();
  });
});
