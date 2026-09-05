import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NavShortcuts } from "./NavShortcuts";
import type { CurrentGoalData } from "@/lib/use-current-goal";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

vi.mock("@/lib/use-current-goal", () => ({
  useCurrentGoal: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

import { usePathname } from "next/navigation";
import { useCurrentGoal } from "@/lib/use-current-goal";

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

describe("NavShortcuts", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows the New Goal shortcut when there is no active goal", () => {
    vi.mocked(usePathname).mockReturnValue("/");
    setGoal({ currentGoal: undefined });
    render(<NavShortcuts />);
    const link = screen.getByRole("button", { name: /create new goal/i }).closest("a");
    expect(link).toHaveAttribute("href", "/goals?new=true");
    expect(screen.queryByRole("button", { name: /go to dashboard/i })).not.toBeInTheDocument();
  });

  it("swaps to a Dashboard shortcut when an active goal exists", () => {
    vi.mocked(usePathname).mockReturnValue("/goals");
    setGoal({
      currentGoal: {
        id: "g1",
        userId: "u",
        startDate: "2026-01-01",
        endDate: "2026-12-31",
        dailyWordTarget: 500,
        totalWordTarget: 182500,
        mode: "static",
      },
    });
    render(<NavShortcuts />);
    const link = screen.getByRole("button", { name: /go to dashboard/i }).closest("a");
    expect(link).toHaveAttribute("href", "/");
    expect(screen.queryByRole("button", { name: /create new goal/i })).not.toBeInTheDocument();
  });

  it("hides the Dashboard shortcut when already on the dashboard", () => {
    vi.mocked(usePathname).mockReturnValue("/");
    setGoal({
      currentGoal: {
        id: "g1",
        userId: "u",
        startDate: "2026-01-01",
        endDate: "2026-12-31",
        dailyWordTarget: 500,
        totalWordTarget: 182500,
        mode: "static",
      },
    });
    render(<NavShortcuts />);
    expect(screen.queryByRole("button", { name: /go to dashboard/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /create new goal/i })).not.toBeInTheDocument();
  });

  it("keeps the New Goal shortcut while the current goal is still loading", () => {
    vi.mocked(usePathname).mockReturnValue("/");
    setGoal({ currentGoal: undefined, isLoading: true });
    render(<NavShortcuts />);
    expect(screen.getByRole("button", { name: /create new goal/i })).toBeInTheDocument();
  });

  it("hides the Write shortcut when already on the write page", () => {
    vi.mocked(usePathname).mockReturnValue("/write");
    setGoal({ currentGoal: undefined });
    render(<NavShortcuts />);
    expect(screen.queryByRole("button", { name: /^write$/i })).not.toBeInTheDocument();
  });
});
