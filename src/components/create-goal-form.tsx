"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Goal } from "@/app/goals/page";

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
      <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50 strawberry:text-rose-900 cherry:text-rose-300 seafoam:text-cyan-900 ocean:text-cyan-300">
        Create New Goal
      </h2>
      {error && (
        <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20 cherry:bg-red-900/20 ocean:bg-red-900/20">
          <p className="text-sm text-red-800 dark:text-red-200 cherry:text-red-200 ocean:text-red-200">{error}</p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="startDate"
              className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300 strawberry:text-rose-900 cherry:text-rose-300 seafoam:text-cyan-900 ocean:text-cyan-300"
            >
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 strawberry:border-rose-300 strawberry:focus:border-rose-500 strawberry:focus:ring-rose-500 cherry:border-rose-800 cherry:bg-rose-950 cherry:text-rose-100 cherry:focus:border-rose-600 cherry:focus:ring-rose-600 seafoam:border-cyan-300 seafoam:focus:border-cyan-500 seafoam:focus:ring-cyan-500 ocean:border-cyan-800 ocean:bg-cyan-950 ocean:text-cyan-100 ocean:focus:border-cyan-600 ocean:focus:ring-cyan-600"
              required
            />
          </div>

          <div>
            <label
              htmlFor="endDate"
              className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300 strawberry:text-rose-900 cherry:text-rose-300 seafoam:text-cyan-900 ocean:text-cyan-300"
            >
              End Date
            </label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 strawberry:border-rose-300 strawberry:focus:border-rose-500 strawberry:focus:ring-rose-500 cherry:border-rose-800 cherry:bg-rose-950 cherry:text-rose-100 cherry:focus:border-rose-600 cherry:focus:ring-rose-600 seafoam:border-cyan-300 seafoam:focus:border-cyan-500 seafoam:focus:ring-cyan-500 ocean:border-cyan-800 ocean:bg-cyan-950 ocean:text-cyan-100 ocean:focus:border-cyan-600 ocean:focus:ring-cyan-600"
              required
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="dailyWordTarget"
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300 strawberry:text-rose-900 cherry:text-rose-300 seafoam:text-cyan-900 ocean:text-cyan-300"
          >
            Daily Word Target
          </label>
          <input
            type="number"
            id="dailyWordTarget"
            value={dailyWordTarget}
            onChange={(e) => setDailyWordTarget(e.target.value)}
            placeholder="500"
            min="1"
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-400 strawberry:border-rose-300 strawberry:focus:border-rose-500 strawberry:focus:ring-rose-500 cherry:border-rose-800 cherry:bg-rose-950 cherry:text-rose-100 cherry:focus:border-rose-600 cherry:focus:ring-rose-600 seafoam:border-cyan-300 seafoam:focus:border-cyan-500 seafoam:focus:ring-cyan-500 ocean:border-cyan-800 ocean:bg-cyan-950 ocean:text-cyan-100 ocean:focus:border-cyan-600 ocean:focus:ring-cyan-600"
            required
          />
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 strawberry:text-rose-600 cherry:text-rose-400 seafoam:text-cyan-600 ocean:text-cyan-400">
            The number of words you aim to write each day during this period
          </p>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 strawberry:bg-linear-to-r strawberry:from-rose-500 strawberry:to-pink-500 strawberry:hover:from-rose-600 strawberry:hover:to-pink-600 cherry:bg-linear-to-r cherry:from-rose-700 cherry:to-pink-700 cherry:hover:from-rose-600 cherry:hover:to-pink-600 seafoam:bg-linear-to-r seafoam:from-cyan-500 seafoam:to-blue-500 seafoam:hover:from-cyan-600 seafoam:hover:to-blue-600 ocean:bg-linear-to-r ocean:from-cyan-700 ocean:to-blue-700 ocean:hover:from-cyan-600 ocean:hover:to-blue-600"
          >
            Create Goal
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 strawberry:border-rose-300 strawberry:bg-white strawberry:text-rose-700 strawberry:hover:bg-rose-50 cherry:border-rose-800 cherry:bg-rose-950 cherry:text-rose-300 cherry:hover:bg-rose-900 seafoam:border-cyan-300 seafoam:bg-white seafoam:text-cyan-700 seafoam:hover:bg-cyan-50 ocean:border-cyan-800 ocean:bg-cyan-950 ocean:text-cyan-300 ocean:hover:bg-cyan-900"
          >
            Cancel
          </button>
        </div>
      </form>
    </Card>
  );
}
