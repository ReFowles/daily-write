"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { themeClasses } from "@/lib/theme-utils";
import { cn } from "@/lib/class-utils";
import type { Goal } from "@/lib/types";

interface CreateGoalFormProps {
  onSubmit: (goal: Omit<Goal, "id">, onError: (message: string) => void) => void;
  onCancel: () => void;
}

export function CreateGoalForm({ onSubmit, onCancel }: CreateGoalFormProps) {
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState("");
  const [dailyWordTarget, setDailyWordTarget] = useState("");
  const [error, setError] = useState("");

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
            placeholder="500"
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
