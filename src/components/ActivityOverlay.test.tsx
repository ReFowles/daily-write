import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ActivityOverlay from "./ActivityOverlay";

describe("ActivityOverlay", () => {
  const originalHiddenDescriptor = Object.getOwnPropertyDescriptor(
    Document.prototype,
    "hidden"
  );

  beforeEach(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => false,
    });
  });

  afterEach(() => {
    if (originalHiddenDescriptor) {
      Object.defineProperty(Document.prototype, "hidden", originalHiddenDescriptor);
    }
    vi.restoreAllMocks();
  });

  it("renders nothing while the window is active", () => {
    const { container } = render(<ActivityOverlay />);
    expect(container.firstChild).toBeNull();
  });

  it("shows the overlay on window blur and hides it on focus", () => {
    render(<ActivityOverlay />);

    act(() => {
      window.dispatchEvent(new Event("blur"));
    });

    expect(
      screen.getByRole("heading", { name: /come back to track your progress/i })
    ).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new Event("focus"));
    });

    expect(
      screen.queryByRole("heading", { name: /come back to track your progress/i })
    ).not.toBeInTheDocument();
  });

  it("responds to document visibilitychange", () => {
    render(<ActivityOverlay />);

    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => true,
    });

    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });

    expect(
      screen.getByRole("heading", { name: /come back to track your progress/i })
    ).toBeInTheDocument();
  });
});
