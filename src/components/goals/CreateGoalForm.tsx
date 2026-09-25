"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { LuChevronDown, LuInfo, LuX } from "react-icons/lu";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { themeClasses } from "@/lib/theme-utils";
import { cn } from "@/lib/class-utils";
import { useToggle } from "@/lib/use-toggle";
import { daysBetweenInclusive, formatDate, parseLocalDate, toDateString } from "@/lib/date-utils";
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
  const [casual, setCasual] = useState(false);
  const [rollover, setRollover] = useState(false);
  const [excludedDays, setExcludedDays] = useState<string[]>([]);
  const [excludeInput, setExcludeInput] = useState("");
  const [cheatDaysValue, setCheatDaysValue] = useState("");
  const [cheatDaysReduceTotal, setCheatDaysReduceTotal] = useState(false);
  const [error, setError] = useState("");
  const { isOpen: showOptions, toggle: toggleOptions } = useToggle(false);

  const days = daysBetweenInclusive(startDate, endDate);
  // Rest days don't count toward the goal, so pacing math is spread over the
  // remaining writing days only.
  const writingDays = Math.max(0, days - excludedDays.length);

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

  const suggestedTotal = writingDays > 0 ? suggestedDaily * writingDays : suggestedDaily * 30;

  // Re-derives the linked field (daily or total) whenever the number of writing
  // days changes — from date edits or rest-day changes.
  const relinkTargets = (nextWritingDays: number) => {
    if (nextWritingDays <= 0) return;
    if (lastEdited === "daily") {
      const daily = parseInt(dailyValue, 10);
      if (Number.isFinite(daily) && daily > 0) {
        setTotalValue(String(daily * nextWritingDays));
      }
    } else {
      const total = parseInt(totalValue, 10);
      if (Number.isFinite(total) && total > 0) {
        setDailyValue(String(Math.ceil(total / nextWritingDays)));
      }
    }
  };

  const handleStartDateChange = (value: string) => {
    setStartDate(value);
    const nextExcluded = excludedDays.filter((d) => (!value || d >= value) && (!endDate || d <= endDate));
    setExcludedDays(nextExcluded);
    relinkTargets(Math.max(0, daysBetweenInclusive(value, endDate) - nextExcluded.length));
  };

  const handleEndDateChange = (value: string) => {
    setEndDate(value);
    const nextExcluded = excludedDays.filter((d) => (!startDate || d >= startDate) && (!value || d <= value));
    setExcludedDays(nextExcluded);
    relinkTargets(Math.max(0, daysBetweenInclusive(startDate, value) - nextExcluded.length));
  };

  const addExcludedDay = (value: string) => {
    if (!value) return;
    if (startDate && value < startDate) return;
    if (endDate && value > endDate) return;
    if (excludedDays.includes(value)) return;
    const next = [...excludedDays, value].sort();
    setExcludedDays(next);
    setExcludeInput("");
    relinkTargets(Math.max(0, daysBetweenInclusive(startDate, endDate) - next.length));
  };

  const removeExcludedDay = (value: string) => {
    const next = excludedDays.filter((d) => d !== value);
    setExcludedDays(next);
    relinkTargets(Math.max(0, daysBetweenInclusive(startDate, endDate) - next.length));
  };

  const handleDailyChange = (value: string) => {
    setDailyValue(value);
    setLastEdited("daily");
    const daily = parseInt(value, 10);
    if (writingDays > 0 && Number.isFinite(daily) && daily > 0) {
      setTotalValue(String(daily * writingDays));
    } else if (value === "") {
      setTotalValue("");
    }
  };

  const handleTotalChange = (value: string) => {
    setTotalValue(value);
    setLastEdited("total");
    const total = parseInt(value, 10);
    if (writingDays > 0 && Number.isFinite(total) && total > 0) {
      setDailyValue(String(Math.ceil(total / writingDays)));
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

    const parsedCheatDays = parseInt(cheatDaysValue, 10);
    const cheatDaysAllowed =
      Number.isFinite(parsedCheatDays) && parsedCheatDays > 0 ? parsedCheatDays : 0;

    onSubmit(
      {
        startDate,
        endDate,
        dailyWordTarget: daily,
        totalWordTarget: total,
        mode,
        casual,
        excludedDays,
        cheatDaysAllowed,
        cheatDaysUsed: [],
        cheatDaysReduceTotal,
        rollover,
        rolloverDays: [],
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
            ? `${days} day${days === 1 ? "" : "s"}${
                excludedDays.length > 0 ? ` (${writingDays} writing)` : ""
              } — editing one field updates the other.`
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

        <div className={cn("border-t pt-4", themeClasses.border.divider)}>
          <button
            type="button"
            onClick={toggleOptions}
            aria-expanded={showOptions}
            className={cn(
              "flex w-full items-center justify-between text-base font-medium transition-opacity hover:opacity-70",
              themeClasses.text.primary
            )}
          >
            <span>Options</span>
            <LuChevronDown className={cn("h-4 w-4 transition-transform", showOptions && "rotate-180")} />
          </button>

          {showOptions && (
            <div className="mt-4 space-y-4">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={casual}
                    onChange={setCasual}
                    aria-label="Casual goal"
                  />
                  <span className={cn("text-base font-medium", themeClasses.text.primary)}>Casual</span>
                  <InfoPopover label="About Casual goals">
                    Days with no writing show up neutral gray instead of red, so a missed
                    day doesn&apos;t look like a failure.
                  </InfoPopover>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={rollover}
                    onChange={setRollover}
                    aria-label="Rollover"
                  />
                  <span className={cn("text-base font-medium", themeClasses.text.primary)}>Rollover</span>
                  <InfoPopover label="About Rollover">
                    Lets you reuse a day&apos;s extra words. Tap a red day on the
                    calendar to pull excess from any surplus day in the goal and
                    turn it green.
                  </InfoPopover>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <label
                  htmlFor="cheatDaysAllowed"
                  className={cn("flex items-center gap-2 text-base font-medium", themeClasses.text.label)}
                >
                  <span>Cheat Days</span>
                  <InfoPopover label="About Cheat Days">
                    A pool of skip days you can spend later from the calendar. A spent
                    cheat day turns gray and never counts, whether you wrote that day
                    or not.
                  </InfoPopover>
                </label>
                <Input
                  type="number"
                  id="cheatDaysAllowed"
                  value={cheatDaysValue}
                  onChange={(e) => setCheatDaysValue(e.target.value)}
                  placeholder="0"
                  min="0"
                  className="max-w-24"
                />
                <div className="flex items-center gap-2">
                  <Switch
                    checked={cheatDaysReduceTotal}
                    onChange={setCheatDaysReduceTotal}
                    aria-label="Cheat days deduct from goal total"
                  />
                  <span className={cn("text-sm font-medium", themeClasses.text.label)}>
                    Deduct from total
                  </span>
                  <InfoPopover label="About deducting cheat days from the total">
                    On: each spent cheat day lowers the goal total by one day&apos;s target,
                    so you don&apos;t make those words up. Off: the total stays put and the
                    remaining words spread across your other writing days.
                  </InfoPopover>
                </div>
              </div>

              <div className="space-y-2">
                <div className={cn("flex items-center gap-2 text-base font-medium", themeClasses.text.label)}>
                  <span>Rest Days</span>
                  <InfoPopover label="About Rest Days">
                    Days you know you won&apos;t write. They&apos;re dropped from the
                    target math, stay gray on the calendar, and only show up in a
                    goal&apos;s logged days if you end up writing anyway.
                  </InfoPopover>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={excludeInput}
                    onChange={(e) => setExcludeInput(e.target.value)}
                    min={startDate || undefined}
                    max={endDate || undefined}
                    aria-label="Rest day date"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => addExcludedDay(excludeInput)}
                    disabled={!excludeInput || !endDate}
                  >
                    Add
                  </Button>
                </div>
                {excludedDays.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {excludedDays.map((date) => (
                      <span
                        key={date}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm",
                          "bg-surface-sunken",
                          themeClasses.text.secondary
                        )}
                      >
                        {formatDate(date)}
                        <button
                          type="button"
                          onClick={() => removeExcludedDay(date)}
                          aria-label={`Remove rest day ${formatDate(date)}`}
                          className="transition-colors hover:text-red-600 dark:hover:text-red-400"
                        >
                          <LuX className="h-4 w-4" aria-hidden />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

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
