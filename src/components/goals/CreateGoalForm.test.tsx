import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CreateGoalForm } from "./CreateGoalForm";
import type { Goal, WritingSession } from "@/lib/types";

describe("CreateGoalForm", () => {
  it("submits the form values through onSubmit", () => {
    const onSubmit = vi.fn();
    const onCancel = vi.fn();
    render(<CreateGoalForm onSubmit={onSubmit} onCancel={onCancel} />);

    const startInput = screen.getByLabelText(/start date/i) as HTMLInputElement;
    const endInput = screen.getByLabelText(/end date/i) as HTMLInputElement;
    const targetInput = screen.getByLabelText(/daily word target/i) as HTMLInputElement;

    fireEvent.change(startInput, { target: { value: "2026-06-01" } });
    fireEvent.change(endInput, { target: { value: "2026-06-30" } });
    fireEvent.change(targetInput, { target: { value: "450" } });

    fireEvent.click(screen.getByRole("button", { name: /create goal/i }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const [payload] = onSubmit.mock.calls[0];
    expect(payload).toEqual({
      startDate: "2026-06-01",
      endDate: "2026-06-30",
      dailyWordTarget: 450,
    });
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
      target: { value: "2026-12-01" },
    });
    fireEvent.change(screen.getByLabelText(/daily word target/i), {
      target: { value: "100" },
    });
    fireEvent.click(screen.getByRole("button", { name: /create goal/i }));

    expect(screen.getByText("Overlapping goal")).toBeInTheDocument();
  });

  it("suggests a target based on the last completed goal", () => {
    // Mock "today" so the completed goal is unambiguously in the past.
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
        },
      ];
      // 10 days, 3000 words total => avg 300/day => suggested = 320 rounded to 320.
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
      const target = screen.getByLabelText(/daily word target/i) as HTMLInputElement;
      expect(target.placeholder).toBe("320");
    } finally {
      vi.useRealTimers();
    }
  });

  it("falls back to a default suggestion when there are no completed goals", () => {
    render(<CreateGoalForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    const target = screen.getByLabelText(/daily word target/i) as HTMLInputElement;
    expect(target.placeholder).toBe("500");
  });
});
