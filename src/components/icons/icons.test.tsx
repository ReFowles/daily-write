import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
  Trash,
} from "./index";

const cases = [
  ["ChevronRight", ChevronRight],
  ["ChevronLeft", ChevronLeft],
  ["ChevronDown", ChevronDown],
  ["Sun", Sun],
  ["Moon", Moon],
  ["Trash", Trash],
] as const;

describe("icons", () => {
  it.each(cases)("%s renders an svg with the default class", (_name, Icon) => {
    const { container } = render(<Icon />);
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute("class")).toContain("h-");
  });

  it.each(cases)("%s accepts a custom className", (_name, Icon) => {
    const { container } = render(<Icon className="h-8 w-8 text-red-500" />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("class")).toBe("h-8 w-8 text-red-500");
  });
});
