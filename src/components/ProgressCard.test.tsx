import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// next/link is a client-navigation wrapper; a plain <a> is enough for rendering assertions.
vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

import { ProgressCard } from "./ProgressCard";

describe("ProgressCard", () => {
  it("shows a CTA to create a goal when goal is 0", () => {
    render(<ProgressCard title="Today" current={0} goal={0} />);
    expect(screen.getByRole("link", { name: /create a goal/i })).toHaveAttribute(
      "href",
      "/goals?new=true"
    );
    expect(screen.queryByText(/%$/)).not.toBeInTheDocument();
  });

  it("renders percentage rounded from current/goal", () => {
    render(<ProgressCard title="Today" current={250} goal={500} />);
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Today" })).toBeInTheDocument();
  });

  it("clamps at 100% when current exceeds goal", () => {
    render(<ProgressCard title="Today" current={9999} goal={500} />);
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("renders the optional message", () => {
    render(<ProgressCard title="Today" current={100} goal={500} message="Keep going!" />);
    expect(screen.getByText("Keep going!")).toBeInTheDocument();
  });
});
