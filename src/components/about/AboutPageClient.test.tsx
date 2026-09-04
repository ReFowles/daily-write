import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const useSessionMock = vi.fn();
vi.mock("next-auth/react", () => ({
  useSession: () => useSessionMock(),
}));

vi.mock("@/lib/use-current-goal", () => ({
  useCurrentGoal: () => ({
    todayGoal: 0,
    todayProgress: 0,
    daysLeft: 0,
    currentGoal: undefined,
    isLoading: false,
  }),
}));

import { AboutPageClient } from "./AboutPageClient";

const THEME_CLASSES = [
  "dark",
  "strawberry",
  "cherry",
  "seafoam",
  "ocean",
  "sunrise",
  "sunset",
  "energy",
  "ambition",
] as const;

function currentAppliedThemeClass(): string | undefined {
  return THEME_CLASSES.find((c) => document.documentElement.classList.contains(c));
}

describe("AboutPageClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    document.documentElement.classList.remove(...THEME_CLASSES);
    useSessionMock.mockReturnValue({ data: null });
  });

  afterEach(() => {
    document.documentElement.classList.remove(...THEME_CLASSES);
  });

  it("shows the hero + sign-in CTA when signed out", () => {
    render(
      <AboutPageClient
        isSignedIn={false}
        signInSlot={<button>Sign in with Google</button>}
      />
    );

    expect(
      screen.getByRole("heading", { level: 1, name: /build a writing habit/i })
    ).toBeInTheDocument();
    // The sign-in slot appears at least twice: hero + bottom CTA.
    expect(screen.getAllByRole("button", { name: /sign in with google/i }).length).toBeGreaterThan(
      1
    );
    expect(screen.getByRole("heading", { name: /ready to write today/i })).toBeInTheDocument();
  });

  it("shows the PageHeader (no bottom CTA) when signed in", () => {
    useSessionMock.mockReturnValue({ data: { user: { email: "user@example.com" } } });

    render(
      <AboutPageClient
        isSignedIn={true}
        signInSlot={<button>Sign in with Google</button>}
      />
    );

    expect(screen.getByRole("heading", { level: 1, name: /^about$/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /ready to write today/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /sign in with google/i })).not.toBeInTheDocument();
  });

  it("applies a theme when a theme swatch is clicked", async () => {
    render(
      <AboutPageClient
        isSignedIn={false}
        signInSlot={<button>Sign in with Google</button>}
      />
    );
    // Flush the microtask that seeds the initial theme state.
    await act(async () => {});

    fireEvent.click(screen.getByRole("button", { name: /apply strawberry theme/i }));

    await waitFor(() => {
      expect(currentAppliedThemeClass()).toBe("strawberry");
    });
    expect(localStorage.getItem("theme")).toBe("strawberry");
    expect(
      screen.getByRole("button", { name: /apply strawberry theme/i })
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("selecting Light removes all applied theme classes", async () => {
    document.documentElement.classList.add("cherry");
    render(
      <AboutPageClient
        isSignedIn={false}
        signInSlot={<button>Sign in with Google</button>}
      />
    );
    await act(async () => {});

    fireEvent.click(screen.getByRole("button", { name: /apply light theme/i }));

    await waitFor(() => {
      expect(currentAppliedThemeClass()).toBeUndefined();
    });
    expect(localStorage.getItem("theme")).toBe("light");
  });

  it("syncs the active swatch when the theme changes elsewhere (e.g. nav toggle)", async () => {
    render(
      <AboutPageClient
        isSignedIn={false}
        signInSlot={<button>Sign in with Google</button>}
      />
    );
    await act(async () => {});

    // Simulate another component (like the nav's ThemeToggle) applying a theme:
    // mutate <html> class the same way useAppliedTheme's setter would.
    await act(async () => {
      document.documentElement.classList.add("ocean");
      localStorage.setItem("theme", "ocean");
    });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /apply ocean theme/i })
      ).toHaveAttribute("aria-pressed", "true");
    });
    expect(
      screen.getByRole("button", { name: /apply light theme/i })
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("renders the limitations FAQ with expandable items", () => {
    render(
      <AboutPageClient
        isSignedIn={false}
        signInSlot={<button>Sign in with Google</button>}
      />
    );

    expect(screen.getByText(/can i edit a goal after i create it\?/i)).toBeInTheDocument();
    expect(screen.getByText(/can goals overlap\?/i)).toBeInTheDocument();
    expect(screen.getByText(/can i create or delete document tabs\?/i)).toBeInTheDocument();
    expect(screen.getByText(/does dailywrite ever store my writing\?/i)).toBeInTheDocument();
    expect(screen.getByText(/what kinds of goals can i set\?/i)).toBeInTheDocument();
  });
});
