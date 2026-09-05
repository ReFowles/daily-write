import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CreateGoalForm } from "./CreateGoalForm";
import type { Goal, WritingSession } from "@/lib/types";

describe("CreateGoalForm", () => {
  it("submits daily/total/mode through onSubmit", () => {
    const onSubmit = vi.fn();
    const onCancel = vi.fn();
    render(<CreateGoalForm onSubmit={onSubmit} onCancel={onCancel} />);

    const startInput = screen.getByLabelText(/start date/i) as HTMLInputElement;
    const endInput = screen.getByLabelText(/end date/i) as HTMLInputElement;
    const dailyInput = screen.getByLabelText(/daily target/i) as HTMLInputElement;
    const totalInput = screen.getByLabelText(/total target/i) as HTMLInputElement;

    fireEvent.change(startInput, { target: { value: "2026-06-01" } });
    fireEvent.change(endInput, { target: { value: "2026-06-30" } });
    fireEvent.change(dailyInput, { target: { value: "450" } });

    // Editing the daily target should auto-populate the linked total (30 × 450),
    // displayed with a thousands separator.
    expect(totalInput.value).toBe("13,500");

    fireEvent.click(screen.getByRole("button", { name: /create goal/i }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const [payload] = onSubmit.mock.calls[0];
    expect(payload).toEqual({
      startDate: "2026-06-01",
      endDate: "2026-06-30",
      dailyWordTarget: 450,
      totalWordTarget: 13500,
      mode: "static",
    });
  });

  it("recomputes the daily target when the user edits the total", () => {
    render(<CreateGoalForm onSubmit={vi.fn()} onCancel={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/start date/i), {
      target: { value: "2026-06-01" },
    });
    fireEvent.change(screen.getByLabelText(/end date/i), {
      target: { value: "2026-06-10" },
    });
    fireEvent.change(screen.getByLabelText(/total target/i), {
      target: { value: "1000" },
    });

    const dailyInput = screen.getByLabelText(/daily target/i) as HTMLInputElement;
    // 1000 / 10 days = 100/day.
    expect(dailyInput.value).toBe("100");
  });

  it("saves the selected mode when the Live radio is chosen", () => {
    const onSubmit = vi.fn();
    render(<CreateGoalForm onSubmit={onSubmit} onCancel={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/start date/i), {
      target: { value: "2026-06-01" },
    });
    fireEvent.change(screen.getByLabelText(/end date/i), {
      target: { value: "2026-06-30" },
    });
    fireEvent.change(screen.getByLabelText(/daily target/i), {
      target: { value: "100" },
    });
    fireEvent.click(screen.getByRole("radio", { name: /live/i }));

    fireEvent.click(screen.getByRole("button", { name: /create goal/i }));
    const [payload] = onSubmit.mock.calls[0];
    expect(payload.mode).toBe("live");
  });

  it("reveals an info popover when the mode's info icon is clicked", () => {
    render(<CreateGoalForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    const infoButton = screen.getByRole("button", { name: /about live mode/i });
    fireEvent.click(infoButton);
    expect(screen.getByRole("dialog", { name: /about live mode/i })).toHaveTextContent(
      /recalculates/i
    );
  });

  it("invokes onCancel when the cancel button is clicked", () => {
    const onSubmit = vi.fn();
    const onCancel = vi.fn();
    render(<CreateGoalForm onSubmit={onSubmit} onCancel={onCancel} />);

    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("surfaces validation errors passed back from onSubmit", () => {
    const onSubmit = vi.fn((_goal, onError) => onError("Overlapping goal"));
    render(<CreateGoalForm onSubmit={onSubmit} onCancel={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/end date/i), {
      target: { value: "2099-12-01" },
    });
    fireEvent.change(screen.getByLabelText(/daily target/i), {
      target: { value: "100" },
    });
    fireEvent.click(screen.getByRole("button", { name: /create goal/i }));

    expect(screen.getByText("Overlapping goal")).toBeInTheDocument();
  });

  it("suggests a target based on the last completed goal", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 15));
    try {
      const goals: Goal[] = [
        {
          id: "past",
          userId: "u1",
          startDate: "2026-01-01",
          endDate: "2026-01-10",
          dailyWordTarget: 300,
          totalWordTarget: 3000,
          mode: "static",
        },
      ];
      const sessions: WritingSession[] = Array.from({ length: 10 }, (_, i) => ({
        userId: "u1",
        date: `2026-01-${String(i + 1).padStart(2, "0")}`,
        wordCount: 300,
      }));

      render(
        <CreateGoalForm
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
          goals={goals}
          writingSessions={sessions}
        />
      );
      const target = screen.getByLabelText(/daily target/i) as HTMLInputElement;
      expect(target.placeholder).toBe("320");
    } finally {
      vi.useRealTimers();
    }
  });

  it("falls back to a default suggestion when there are no completed goals", () => {
    render(<CreateGoalForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    const target = screen.getByLabelText(/daily target/i) as HTMLInputElement;
    expect(target.placeholder).toBe("500");
  });
});
