import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DayCard } from "./DayCard";

describe("DayCard", () => {
  const day = new Date(2026, 5, 15);

  it("renders an empty compact placeholder when date is null", () => {
    const { container } = render(
      <DayCard variant="compact" date={null} wordsWritten={0} goal={null} isToday={false} isFuture={false} />
    );
    expect(container.firstChild).toHaveClass("min-h-[60px]");
  });

  it("renders empty non-compact placeholder as an empty div when date is null", () => {
    const { container } = render(
      <DayCard date={null} wordsWritten={0} goal={null} isToday={false} isFuture={false} />
    );
    expect(container.firstChild).toBeEmptyDOMElement();
  });

  it("shows words vs. goal for a past day", () => {
    render(
      <DayCard date={day} wordsWritten={250} goal={500} isToday={false} isFuture={false} />
    );
    const cell = screen.getByRole("gridcell");
    expect(cell.getAttribute("aria-label")).toContain("written: 250 words");
    expect(cell.getAttribute("aria-label")).toContain("goal: 500 words");
    expect(cell.textContent).toMatch(/250\s*\/\s*500/);
  });

  it("shows a positive difference when the goal is exceeded", () => {
    render(
      <DayCard date={day} wordsWritten={600} goal={500} isToday={false} isFuture={false} />
    );
    expect(screen.getByText("+100")).toBeInTheDocument();
  });

  it("shows a negative difference when the goal is not met", () => {
    render(
      <DayCard date={day} wordsWritten={300} goal={500} isToday={false} isFuture={false} />
    );
    expect(screen.getByText("-200")).toBeInTheDocument();
  });

  it("hides written words for a future day, keeps the goal target", () => {
    render(
      <DayCard date={day} wordsWritten={0} goal={500} isToday={false} isFuture={true} />
    );
    const cell = screen.getByRole("gridcell");
    expect(cell.getAttribute("aria-label")).not.toContain("written");
    expect(cell.getAttribute("aria-label")).toContain("goal: 500 words");
    expect(screen.queryByText("+0")).not.toBeInTheDocument();
  });

  it("renders raw word count when there is no goal", () => {
    render(
      <DayCard date={day} wordsWritten={120} goal={null} isToday={false} isFuture={false} />
    );
    expect(screen.getByText("120")).toBeInTheDocument();
    const cell = screen.getByRole("gridcell");
    expect(cell.getAttribute("aria-label")).not.toContain("goal:");
  });
});
