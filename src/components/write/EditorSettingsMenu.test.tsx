import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EditorSettingsMenu } from "./EditorSettingsMenu";

function renderMenu(overrides: Partial<React.ComponentProps<typeof EditorSettingsMenu>> = {}) {
  const props: React.ComponentProps<typeof EditorSettingsMenu> = {
    focusMode: false,
    onToggleFocusMode: vi.fn(),
    lineSpacing: "normal",
    onCycleLineSpacing: vi.fn(),
    fontSize: "medium",
    onCycleFontSize: vi.fn(),
    paragraphIndent: false,
    onToggleParagraphIndent: vi.fn(),
    ...overrides,
  };
  render(<EditorSettingsMenu {...props} />);
  return props;
}

describe("EditorSettingsMenu", () => {
  it("hides the panel until the gear button is clicked", () => {
    renderMenu();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /editor settings/i }));
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("shows the current state of each setting", () => {
    renderMenu({ focusMode: true, lineSpacing: "relaxed", fontSize: "large", paragraphIndent: true });
    fireEvent.click(screen.getByRole("button", { name: /editor settings/i }));

    expect(screen.getByRole("menuitemcheckbox", { name: /focus mode/i })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("menuitem", { name: /line spacing/i })).toHaveTextContent("Relaxed");
    expect(screen.getByRole("menuitem", { name: /font size/i })).toHaveTextContent("Large");
    expect(screen.getByRole("menuitemcheckbox", { name: /paragraph indent/i })).toHaveAttribute("aria-checked", "true");
  });

  it("invokes the matching callback when a setting is clicked", () => {
    const props = renderMenu();
    fireEvent.click(screen.getByRole("button", { name: /editor settings/i }));

    fireEvent.click(screen.getByRole("menuitemcheckbox", { name: /focus mode/i }));
    expect(props.onToggleFocusMode).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("menuitem", { name: /line spacing/i }));
    expect(props.onCycleLineSpacing).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("menuitem", { name: /font size/i }));
    expect(props.onCycleFontSize).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("menuitemcheckbox", { name: /paragraph indent/i }));
    expect(props.onToggleParagraphIndent).toHaveBeenCalledTimes(1);
  });

  it("closes when clicking outside the panel", () => {
    renderMenu();
    fireEvent.click(screen.getByRole("button", { name: /editor settings/i }));
    expect(screen.getByRole("menu")).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("closes on Escape", () => {
    renderMenu();
    fireEvent.click(screen.getByRole("button", { name: /editor settings/i }));
    expect(screen.getByRole("menu")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
});
