import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./Button";

describe("Button", () => {
  it("renders children and calls onClick", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save</Button>);
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does not fire onClick when disabled", () => {
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} disabled>
        Save
      </Button>
    );
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("forwards aria-label and type", () => {
    render(
      <Button type="submit" aria-label="Save changes">
        Save
      </Button>
    );
    const btn = screen.getByRole("button", { name: "Save changes" });
    expect(btn).toHaveAttribute("type", "submit");
  });

  it.each(["primary", "secondary", "icon"] as const)("renders %s variant", (variant) => {
    render(<Button variant={variant}>hi</Button>);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it.each(["sm", "md", "lg"] as const)("renders %s size", (size) => {
    render(<Button size={size}>hi</Button>);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });
});
