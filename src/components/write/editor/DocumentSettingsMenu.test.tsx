import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DocumentSettingsMenu } from "./DocumentSettingsMenu";

function renderMenu(overrides: Partial<React.ComponentProps<typeof DocumentSettingsMenu>> = {}) {
  const props: React.ComponentProps<typeof DocumentSettingsMenu> = {
    smartQuotes: true,
    onToggleSmartQuotes: vi.fn(),
    onApplyManuscriptFormat: vi.fn(),
    onRestoreDefaultFormat: vi.fn(),
    ...overrides,
  };
  render(<DocumentSettingsMenu {...props} />);
  return props;
}

function openMenu() {
  fireEvent.click(screen.getByRole("button", { name: /document settings/i }));
}

describe("DocumentSettingsMenu", () => {
  it("hides the panel until the document button is clicked", () => {
    renderMenu();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    openMenu();
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("reflects the current smart-quotes state via aria-checked", () => {
    renderMenu({ smartQuotes: false });
    openMenu();

    expect(
      screen.getByRole("menuitemcheckbox", { name: /smart quotes/i })
    ).toHaveAttribute("aria-checked", "false");
  });

  it("invokes the smart-quotes callback when toggled", () => {
    const props = renderMenu();
    openMenu();

    fireEvent.click(screen.getByRole("menuitemcheckbox", { name: /smart quotes/i }));
    expect(props.onToggleSmartQuotes).toHaveBeenCalledTimes(1);
  });

  it("triggers the apply and restore actions and closes the menu", () => {
    const props = renderMenu();

    openMenu();
    fireEvent.click(screen.getByRole("menuitem", { name: /apply smf/i }));
    expect(props.onApplyManuscriptFormat).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    openMenu();
    fireEvent.click(screen.getByRole("menuitem", { name: /apply default formatting/i }));
    expect(props.onRestoreDefaultFormat).toHaveBeenCalledTimes(1);
  });

  it("disables the format actions when disabled", () => {
    const props = renderMenu({ manuscriptFormatDisabled: true });
    openMenu();

    const applyButton = screen.getByRole("menuitem", {
      name: /apply smf/i,
    });
    const restoreButton = screen.getByRole("menuitem", {
      name: /apply default formatting/i,
    });
    expect(applyButton).toBeDisabled();
    expect(restoreButton).toBeDisabled();

    fireEvent.click(applyButton);
    fireEvent.click(restoreButton);
    expect(props.onApplyManuscriptFormat).not.toHaveBeenCalled();
    expect(props.onRestoreDefaultFormat).not.toHaveBeenCalled();
  });

  it("disables the format actions while a change is in progress", () => {
    renderMenu({ manuscriptFormatBusy: true });
    openMenu();

    expect(
      screen.getByRole("menuitem", { name: /apply smf/i })
    ).toBeDisabled();
  });

  it("closes on outside click and on Escape", () => {
    renderMenu();
    fireEvent.click(screen.getByRole("button", { name: /document settings/i }));
    expect(screen.getByRole("menu")).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /document settings/i }));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
});
