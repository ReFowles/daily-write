import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProgressBar } from "./ProgressBar";

function getFill(container: HTMLElement): HTMLDivElement {
  return container.querySelector('[style*="width"]') as HTMLDivElement;
}

describe("ProgressBar", () => {
  it("renders width equal to the value", () => {
    const { container } = render(<ProgressBar value={40} />);
    expect(getFill(container).style.width).toBe("40%");
  });

  it("clamps values above 100", () => {
    const { container } = render(<ProgressBar value={150} />);
    expect(getFill(container).style.width).toBe("100%");
  });

  it("clamps values below 0", () => {
    const { container } = render(<ProgressBar value={-25} />);
    expect(getFill(container).style.width).toBe("0%");
  });

  it("applies green fill for completed goals at or over 100%", () => {
    const { container } = render(<ProgressBar value={100} isCompleted />);
    expect(getFill(container).className).toContain("bg-green-500");
  });

  it("applies red fill for completed goals under 100%", () => {
    const { container } = render(<ProgressBar value={75} isCompleted />);
    expect(getFill(container).className).toContain("bg-red-500");
  });

  it.each(["sm", "md", "lg"] as const)("renders %s size class", (size) => {
    const { container } = render(<ProgressBar value={50} size={size} />);
    expect((container.firstChild as HTMLElement).className).toContain(
      size === "sm" ? "h-2" : size === "md" ? "h-3" : "h-4"
    );
  });
});
