import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ConfirmDialog } from "./ConfirmDialog";

function renderDialog(overrides: Partial<React.ComponentProps<typeof ConfirmDialog>> = {}) {
  const props: React.ComponentProps<typeof ConfirmDialog> = {
    open: true,
    title: "Apply format?",
    description: "This changes the document.",
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
    ...overrides,
  };
  render(<ConfirmDialog {...props} />);
  return props;
}

describe("ConfirmDialog", () => {
  it("renders nothing when closed", () => {
    renderDialog({ open: false });
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("shows the title and description when open", () => {
    renderDialog();
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByText("Apply format?")).toBeInTheDocument();
    expect(screen.getByText("This changes the document.")).toBeInTheDocument();
  });

  it("fires onConfirm and onCancel from the action buttons", () => {
    const props = renderDialog({ confirmLabel: "Apply", cancelLabel: "Cancel" });

    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    expect(props.onConfirm).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(props.onCancel).toHaveBeenCalledTimes(1);
  });

  it("cancels on Escape when not busy", () => {
    const props = renderDialog();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(props.onCancel).toHaveBeenCalledTimes(1);
  });

  it("disables the actions and ignores Escape while busy", () => {
    const props = renderDialog({ confirmBusy: true, confirmLabel: "Apply" });

    expect(screen.getByRole("button", { name: /working/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeDisabled();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(props.onCancel).not.toHaveBeenCalled();
  });
});
