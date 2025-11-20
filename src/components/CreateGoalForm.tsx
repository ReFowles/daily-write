"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { themeClasses } from "@/lib/theme-utils";
import { cn } from "@/lib/class-utils";
import { parseLocalDate } from "@/lib/date-utils";
import type { Goal, WritingSession } from "@/lib/types";

interface CreateGoalFormProps {
  onSubmit: (goal: Omit<Goal, "id">, onError: (message: string) => void) => void;
  onCancel: () => void;
  goals?: Goal[];
  writingSessions?: WritingSession[];
}

export function CreateGoalForm({ onSubmit, onCancel, goals = [], writingSessions = [] }: CreateGoalFormProps) {
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState("");
  const [dailyWordTarget, setDailyWordTarget] = useState("");
  const [error, setError] = useState("");

  // Calculate smart placeholder based on last completed goal
  const suggestedTarget = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find completed goals (end date before today)
    const completedGoals = goals
      .filter(goal => parseLocalDate(goal.endDate) < today)
      .sort((a, b) => parseLocalDate(b.endDate).getTime() - parseLocalDate(a.endDate).getTime());

    if (completedGoals.length === 0) {
      return 500; // Default
    }

    const lastGoal = completedGoals[0];
    const startDate = parseLocalDate(lastGoal.startDate);
    const endDate = parseLocalDate(lastGoal.endDate);

    // Get all writing sessions within the goal period
    const goalSessions = writingSessions.filter(session => {
      const sessionDate = parseLocalDate(session.date);
      return sessionDate >= startDate && sessionDate <= endDate;
    });

    if (goalSessions.length === 0) {
      return 500; // Default
    }

    // Calculate total words and average
    const totalWords = goalSessions.reduce((sum, session) => sum + session.wordCount, 0);
    const daysInGoal = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const avgPerDay = totalWords / daysInGoal;

    // Add 20 and round to nearest 5
    const suggested = avgPerDay + 20;
    return Math.round(suggested / 5) * 5;
  }, [goals, writingSessions]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); // Clear any previous errors
    onSubmit(
      {
        startDate,
        endDate,
        dailyWordTarget: parseInt(dailyWordTarget),
      },
      (errorMessage: string) => {
        setError(errorMessage);
      }
    );
    // Only reset form if no error (handleCreateGoal will close form on success)
  };

  return (
    <Card className="p-6">
      <h2 className={cn("mb-4 text-xl font-semibold", themeClasses.text.primary)}>
        Create New Goal
      </h2>
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 dark:bg-red-900/20 cherry:bg-red-900/20 ocean:bg-red-900/20">
          <p className="text-sm text-red-800 dark:text-red-200 cherry:text-red-200 ocean:text-red-200">{error}</p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="startDate" className={cn("mb-1 block text-sm font-medium", themeClasses.text.label)}>
              Start Date
            </label>
            <Input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="endDate" className={cn("mb-1 block text-sm font-medium", themeClasses.text.label)}>
              End Date
            </label>
            <Input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="dailyWordTarget" className={cn("mb-1 block text-sm font-medium", themeClasses.text.label)}>
            Daily Word Target
          </label>
          <Input
            type="number"
            id="dailyWordTarget"
            value={dailyWordTarget}
            onChange={(e) => setDailyWordTarget(e.target.value)}
            placeholder={suggestedTarget.toString()}
            min="1"
            required
          />
          <p className={cn("mt-1 text-xs", themeClasses.text.muted)}>
            The number of words you aim to write each day during this period
          </p>
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
