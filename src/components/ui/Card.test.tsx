import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Card } from "./Card";

describe("Card", () => {
  it("renders children", () => {
    render(
      <Card>
        <p>Hello</p>
      </Card>
    );
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("appends caller-provided className", () => {
    const { container } = render(<Card className="extra-class">x</Card>);
    expect(container.firstChild).toHaveClass("extra-class");
  });
});
