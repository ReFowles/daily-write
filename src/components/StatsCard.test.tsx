import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatsCard } from "./StatsCard";

describe("StatsCard", () => {
  it("renders label and value", () => {
    render(<StatsCard label="Total Words" value={1234} />);
    expect(screen.getByText("Total Words")).toBeInTheDocument();
    expect(screen.getByText("1234")).toBeInTheDocument();
  });

  it("renders subtitle when provided", () => {
    render(<StatsCard label="Streak" value={5} subtitle="days in a row" />);
    expect(screen.getByText("days in a row")).toBeInTheDocument();
  });

  it("omits subtitle when not provided", () => {
    const { container } = render(<StatsCard label="X" value="Y" />);
    expect(container.querySelectorAll("div").length).toBeLessThan(5);
  });
});
