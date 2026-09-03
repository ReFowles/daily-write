import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { SortableCards, type SortableCardItem } from "./SortableCards";

const items: SortableCardItem[] = [
  { id: "a", content: <div data-testid="card">Card A</div> },
  { id: "b", content: <div data-testid="card">Card B</div> },
  { id: "c", content: <div data-testid="card">Card C</div> },
];

function orderedCardText(): string[] {
  return screen.getAllByTestId("card").map((el) => el.textContent ?? "");
}

describe("SortableCards", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders each item in the provided order by default", () => {
    render(<SortableCards items={items} storageKey="test-order" />);
    expect(orderedCardText()).toEqual(["Card A", "Card B", "Card C"]);
    expect(screen.getAllByRole("button", { name: /reorder card/i })).toHaveLength(3);
  });

  it("restores a saved order from localStorage", async () => {
    localStorage.setItem("test-order", JSON.stringify(["c", "a", "b"]));
    render(<SortableCards items={items} storageKey="test-order" />);
    expect(await screen.findByText("Card C")).toBeInTheDocument();
    expect(orderedCardText()).toEqual(["Card C", "Card A", "Card B"]);
  });

  it("appends new ids that are not in the saved order", async () => {
    localStorage.setItem("test-order", JSON.stringify(["b", "a"]));
    render(<SortableCards items={items} storageKey="test-order" />);
    expect(await screen.findByText("Card B")).toBeInTheDocument();
    expect(orderedCardText()).toEqual(["Card B", "Card A", "Card C"]);
  });

  it("ignores saved ids that no longer exist", async () => {
    localStorage.setItem("test-order", JSON.stringify(["gone", "b", "a"]));
    render(<SortableCards items={items} storageKey="test-order" />);
    expect(await screen.findByText("Card B")).toBeInTheDocument();
    expect(orderedCardText()).toEqual(["Card B", "Card A", "Card C"]);
  });

  it("hides drag handles when locked", () => {
    render(<SortableCards items={items} storageKey="test-order" locked />);
    expect(orderedCardText()).toEqual(["Card A", "Card B", "Card C"]);
    expect(screen.queryAllByRole("button", { name: /reorder card/i })).toHaveLength(0);
  });
});
