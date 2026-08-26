import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import ThemeToggle from "./ThemeToggle";

const THEME_CLASSES = ["dark", "strawberry", "cherry", "seafoam", "ocean"] as const;

function currentAppliedThemeClass(): string | undefined {
  return THEME_CLASSES.find((c) => document.documentElement.classList.contains(c));
}

describe("ThemeToggle", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove(...THEME_CLASSES);
  });

  afterEach(() => {
    document.documentElement.classList.remove(...THEME_CLASSES);
  });

  it("defaults to Light when nothing is saved", async () => {
    render(<ThemeToggle />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /change theme/i })).toHaveTextContent(/light/i);
    });
  });

  it("hydrates from localStorage on mount", async () => {
    localStorage.setItem("theme", "ocean");
    render(<ThemeToggle />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /change theme/i })).toHaveTextContent(/ocean/i);
    });
  });

  it("falls back to the class applied on <html> when localStorage is empty", async () => {
    document.documentElement.classList.add("cherry");
    render(<ThemeToggle />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /change theme/i })).toHaveTextContent(/cherry/i);
    });
  });

  it("opens the menu and lists all six themes", async () => {
    render(<ThemeToggle />);
    await act(async () => {}); // flush microtask hydration

    fireEvent.click(screen.getByRole("button", { name: /change theme/i }));

    for (const label of ["Light", "Dark", "Strawberry", "Cherry", "Seafoam", "Ocean"]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
  });

  it("applying a non-light theme adds the class, writes localStorage, and closes the menu", async () => {
    render(<ThemeToggle />);
    await act(async () => {});

    fireEvent.click(screen.getByRole("button", { name: /change theme/i }));
    fireEvent.click(screen.getByRole("button", { name: "Strawberry" }));

    expect(currentAppliedThemeClass()).toBe("strawberry");
    expect(localStorage.getItem("theme")).toBe("strawberry");
    // Menu closed → only the trigger button remains.
    expect(screen.queryByRole("button", { name: "Dark" })).not.toBeInTheDocument();
  });

  it("applying Light removes all theme classes", async () => {
    document.documentElement.classList.add("dark");
    render(<ThemeToggle />);
    await act(async () => {});

    fireEvent.click(screen.getByRole("button", { name: /change theme/i }));
    fireEvent.click(screen.getByRole("button", { name: "Light" }));

    expect(currentAppliedThemeClass()).toBeUndefined();
    expect(localStorage.getItem("theme")).toBe("light");
  });

  it("clicking outside closes the menu", async () => {
    render(
      <div>
        <ThemeToggle />
        <button>outside</button>
      </div>
    );
    await act(async () => {});

    fireEvent.click(screen.getByRole("button", { name: /change theme/i }));
    expect(screen.getByRole("button", { name: "Dark" })).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByRole("button", { name: "outside" }));
    expect(screen.queryByRole("button", { name: "Dark" })).not.toBeInTheDocument();
  });
});
