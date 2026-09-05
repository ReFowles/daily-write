"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { LuInfo } from "react-icons/lu";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { themeClasses } from "@/lib/theme-utils";
import { cn } from "@/lib/class-utils";
import { daysBetweenInclusive, parseLocalDate, toDateString } from "@/lib/date-utils";
import type { Goal, GoalMode, WritingSession } from "@/lib/types";

interface CreateGoalFormProps {
  onSubmit: (goal: Omit<Goal, "id" | "userId">, onError: (message: string) => void) => void;
  onCancel: () => void;
  goals?: Goal[];
  writingSessions?: WritingSession[];
}

type LastEdited = "daily" | "total";

export function CreateGoalForm({ onSubmit, onCancel, goals = [], writingSessions = [] }: CreateGoalFormProps) {
  const today = new Date();
  const [startDate, setStartDate] = useState(toDateString(today));
  const [endDate, setEndDate] = useState("");
  const [dailyValue, setDailyValue] = useState("");
  const [totalValue, setTotalValue] = useState("");
  const [lastEdited, setLastEdited] = useState<LastEdited>("daily");
  const [mode, setMode] = useState<GoalMode>("static");
  const [error, setError] = useState("");

  const days = daysBetweenInclusive(startDate, endDate);

  // Smart placeholder for the daily target, based on the last completed goal.
  const suggestedDaily = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const completedGoals = goals
      .filter((goal) => parseLocalDate(goal.endDate) < now)
      .sort((a, b) => parseLocalDate(b.endDate).getTime() - parseLocalDate(a.endDate).getTime());

    if (completedGoals.length === 0) return 500;

    const lastGoal = completedGoals[0];
    const gStart = parseLocalDate(lastGoal.startDate);
    const gEnd = parseLocalDate(lastGoal.endDate);

    const goalSessions = writingSessions.filter((session) => {
      const sessionDate = parseLocalDate(session.date);
      return sessionDate >= gStart && sessionDate <= gEnd;
    });

    if (goalSessions.length === 0) return 500;

    const totalWords = goalSessions.reduce((sum, session) => sum + session.wordCount, 0);
    const daysInGoal = Math.ceil((gEnd.getTime() - gStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const avgPerDay = totalWords / daysInGoal;

    return Math.round((avgPerDay + 20) / 5) * 5;
  }, [goals, writingSessions]);

  const suggestedTotal = days > 0 ? suggestedDaily * days : suggestedDaily * 30;

  const handleStartDateChange = (value: string) => {
    setStartDate(value);
    reconcileFromDates(value, endDate);
  };

  const handleEndDateChange = (value: string) => {
    setEndDate(value);
    reconcileFromDates(startDate, value);
  };

  function reconcileFromDates(nextStart: string, nextEnd: string) {
    const nextDays = daysBetweenInclusive(nextStart, nextEnd);
    if (nextDays <= 0) return;

    if (lastEdited === "daily") {
      const daily = parseInt(dailyValue, 10);
      if (Number.isFinite(daily) && daily > 0) {
        setTotalValue(String(daily * nextDays));
      }
    } else {
      const total = parseInt(totalValue, 10);
      if (Number.isFinite(total) && total > 0) {
        setDailyValue(String(Math.ceil(total / nextDays)));
      }
    }
  }

  const handleDailyChange = (value: string) => {
    setDailyValue(value);
    setLastEdited("daily");
    const daily = parseInt(value, 10);
    if (days > 0 && Number.isFinite(daily) && daily > 0) {
      setTotalValue(String(daily * days));
    } else if (value === "") {
      setTotalValue("");
    }
  };

  const handleTotalChange = (value: string) => {
    setTotalValue(value);
    setLastEdited("total");
    const total = parseInt(value, 10);
    if (days > 0 && Number.isFinite(total) && total > 0) {
      setDailyValue(String(Math.ceil(total / days)));
    } else if (value === "") {
      setDailyValue("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const daily = parseInt(dailyValue, 10);
    const total = parseInt(totalValue, 10);
    if (!Number.isFinite(daily) || daily <= 0 || !Number.isFinite(total) || total <= 0) {
      setError("Enter a daily or total word target.");
      return;
    }

    onSubmit(
      {
        startDate,
        endDate,
        dailyWordTarget: daily,
        totalWordTarget: total,
        mode,
      },
      (errorMessage: string) => {
        setError(errorMessage);
      }
    );
  };

  return (
    <Card className="p-6">
      <h2 className={cn("mb-4 text-xl font-semibold", themeClasses.text.primary)}>
        Create New Goal
      </h2>
      {error && (
        <div className="mb-4 rounded-md bg-red-500/10 p-4">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="startDate" className={cn("mb-1 block text-base font-medium", themeClasses.text.label)}>
              Start Date
            </label>
            <Input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => handleStartDateChange(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="endDate" className={cn("mb-1 block text-base font-medium", themeClasses.text.label)}>
              End Date
            </label>
            <Input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => handleEndDateChange(e.target.value)}
              min={startDate}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="dailyWordTarget" className={cn("mb-1 block text-base font-medium", themeClasses.text.label)}>
              Daily Target
            </label>
            <Input
              type="number"
              id="dailyWordTarget"
              value={dailyValue}
              onChange={(e) => handleDailyChange(e.target.value)}
              placeholder={suggestedDaily.toLocaleString("en-US")}
              min="1"
              formatWithCommas
            />
          </div>

          <div>
            <label htmlFor="totalWordTarget" className={cn("mb-1 block text-base font-medium", themeClasses.text.label)}>
              Total Target
            </label>
            <Input
              type="number"
              id="totalWordTarget"
              value={totalValue}
              onChange={(e) => handleTotalChange(e.target.value)}
              placeholder={suggestedTotal.toLocaleString("en-US")}
              min="1"
              formatWithCommas
            />
          </div>
        </div>

        <p className={cn("-mt-2 text-sm", themeClasses.text.muted)}>
          {days > 0
            ? `${days} day${days === 1 ? "" : "s"} — editing one field updates the other.`
            : "Pick an end date to link the daily and total targets."}
        </p>

        <fieldset>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <legend className={cn("text-base font-bold", themeClasses.text.label)}>
              Type:
            </legend>
            <ModeRadio
              value="static"
              label="Static"
              checked={mode === "static"}
              onChange={setMode}
              info="Locks the daily target set at creation time. It never changes, even if you get ahead or fall behind."
            />
            <ModeRadio
              value="live"
              label="Live"
              checked={mode === "live"}
              onChange={setMode}
              info="Recalculates today's daily target every day using the words you've already written, so you always see the pace you need to hit the total by the end date."
            />
          </div>
        </fieldset>

        <div className="flex gap-2 pt-2">
          <Button type="submit" variant="primary" className="flex-1">
            Create Goal
          </Button>
          <Button type="button" onClick={onCancel} variant="secondary" className="flex-1">
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}

interface ModeRadioProps {
  value: GoalMode;
  label: string;
  checked: boolean;
  onChange: (value: GoalMode) => void;
  info: ReactNode;
}

function ModeRadio({ value, label, checked, onChange, info }: ModeRadioProps) {
  return (
    <label className={cn("flex items-center gap-2 text-base", themeClasses.text.primary)}>
      <input
        type="radio"
        name="goalMode"
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        className="themed-radio"
      />
      <span>{label}</span>
      <InfoPopover label={`About ${label} mode`}>{info}</InfoPopover>
    </label>
  );
}

interface InfoPopoverProps {
  label: string;
  children: ReactNode;
}

const POPOVER_WIDTH = 288; // px
const POPOVER_MARGIN = 12;

// Portal + fixed-position popover matches the pattern used by
// UnverifiedAppNotice / DocCard so it can't be clipped by a card's overflow
// on mobile.
function InfoPopover({ label, children }: InfoPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number; width: number } | null>(
    null
  );
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!isOpen || !buttonRef.current) return;

    const reposition = () => {
      const rect = buttonRef.current!.getBoundingClientRect();
      const viewportWidth = typeof window !== "undefined" ? window.innerWidth : POPOVER_WIDTH;
      const width = Math.min(POPOVER_WIDTH, viewportWidth - POPOVER_MARGIN * 2);
      const left = Math.min(
        Math.max(rect.left, POPOVER_MARGIN),
        Math.max(POPOVER_MARGIN, viewportWidth - width - POPOVER_MARGIN)
      );
      setPosition({ top: rect.bottom + 8, left, width });
    };

    reposition();
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target)) return;
      if (popoverRef.current?.contains(target)) return;
      setIsOpen(false);
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("pointerdown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("pointerdown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isOpen]);

  return (
    <span className="relative inline-flex">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={label}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className={cn(
          "inline-flex h-5 w-5 items-center justify-center rounded-full transition-colors",
          themeClasses.text.secondary,
          "hover:text-fg"
        )}
      >
        <LuInfo className="h-5 w-5" aria-hidden />
      </button>
      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={popoverRef}
            role="dialog"
            aria-label={label}
            style={
              position
                ? { position: "fixed", top: position.top, left: position.left, width: position.width }
                : { position: "fixed", visibility: "hidden" }
            }
            className={cn(
              "z-50 rounded-md border p-3 text-sm shadow-lg",
              themeClasses.border.default,
              themeClasses.background.overlay,
              themeClasses.text.secondary
            )}
          >
            {children}
          </div>,
          document.body
        )}
    </span>
  );
}
