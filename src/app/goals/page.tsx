"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { GoalCard } from "@/components/goal-card";
import { CreateGoalForm } from "@/components/create-goal-form";
import dummyData from "@/lib/dummy-data.json";

export interface Goal {
  id: string;
  startDate: string;
  endDate: string;
  dailyWordTarget: number;
}

export interface WritingSession {
  date: string;
  wordCount: number;
}

export default function GoalsPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [goals, setGoals] = useState<Goal[]>(dummyData.goals as unknown as Goal[]);
  const [writingSessions] = useState<WritingSession[]>(dummyData.writingSessions as unknown as WritingSession[]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const currentGoals = goals.filter((goal) => {
    const startDate = new Date(goal.startDate + "T00:00:00");
    const endDate = new Date(goal.endDate + "T00:00:00");
    return startDate <= today && endDate >= today;
  });
  
  const upcomingGoals = goals.filter((goal) => {
    const startDate = new Date(goal.startDate + "T00:00:00");
    return startDate > today;
  });
  
  const completedGoals = goals.filter((goal) => new Date(goal.endDate + "T00:00:00") < today);

  const handleCreateGoal = (goalData: Omit<Goal, "id">, onError: (message: string) => void) => {
    const newStart = new Date(goalData.startDate + "T00:00:00");
    const newEnd = new Date(goalData.endDate + "T00:00:00");

    // Check for overlapping goals
    const hasOverlap = goals.some((goal) => {
      const existingStart = new Date(goal.startDate + "T00:00:00");
      const existingEnd = new Date(goal.endDate + "T00:00:00");
      
      // Two date ranges overlap if:
      // start1 <= end2 AND start2 <= end1
      return newStart <= existingEnd && existingStart <= newEnd;
    });

    if (hasOverlap) {
      onError("This date range overlaps with an existing goal. Please choose different dates.");
      return;
    }

    const newGoal: Goal = {
      ...goalData,
      id: Date.now().toString(),
    };
    setGoals([newGoal, ...goals]);
    setShowCreateForm(false);
  };

  const handleDeleteGoal = (goalId: string) => {
    setGoals(goals.filter((goal) => goal.id !== goalId));
  };

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 strawberry:bg-linear-to-br strawberry:from-pink-50 strawberry:via-rose-50 strawberry:to-pink-100 cherry:bg-linear-to-br cherry:from-zinc-950 cherry:via-rose-950 cherry:to-zinc-950 seafoam:bg-linear-to-br seafoam:from-cyan-50 seafoam:via-blue-50 seafoam:to-cyan-100 ocean:bg-linear-to-br ocean:from-zinc-950 ocean:via-cyan-950 ocean:to-zinc-950">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50 strawberry:text-rose-900 cherry:text-rose-300 seafoam:text-cyan-900 ocean:text-cyan-300">
              Writing Goals
            </h1>
            <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400 strawberry:text-rose-700 cherry:text-rose-400 seafoam:text-cyan-700 ocean:text-cyan-400">
              Set and track your writing objectives
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="rounded-md bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 strawberry:bg-linear-to-r strawberry:from-rose-500 strawberry:to-pink-500 strawberry:hover:from-rose-600 strawberry:hover:to-pink-600 cherry:bg-linear-to-r cherry:from-rose-700 cherry:to-pink-700 cherry:hover:from-rose-600 cherry:hover:to-pink-600 seafoam:bg-linear-to-r seafoam:from-cyan-500 seafoam:to-blue-500 seafoam:hover:from-cyan-600 seafoam:hover:to-blue-600 ocean:bg-linear-to-r ocean:from-cyan-700 ocean:to-blue-700 ocean:hover:from-cyan-600 ocean:hover:to-blue-600"
          >
            {showCreateForm ? "Cancel" : "New Goal"}
          </button>
        </div>

        {/* Create Goal Form */}
        {showCreateForm && (
          <div className="mb-8">
            <CreateGoalForm
              onSubmit={handleCreateGoal}
              onCancel={() => setShowCreateForm(false)}
            />
          </div>
        )}

        {/* Current Goal */}
        {currentGoals.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50 strawberry:text-rose-900 cherry:text-rose-300 seafoam:text-cyan-900 ocean:text-cyan-300">
              Current Goal
            </h2>
            <div className="space-y-4">
              {currentGoals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  writingSessions={writingSessions}
                  onDelete={handleDeleteGoal}
                />
              ))}
            </div>
          </div>
        )}

        {/* Completed and Upcoming Goals Side by Side */}
        {(completedGoals.length > 0 || upcomingGoals.length > 0) && (
          <div className="grid gap-8 md:grid-cols-2">
            {/* Completed Goals */}
            <div>
              {completedGoals.length > 0 && (
                <>
                  <h2 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50 strawberry:text-rose-900 cherry:text-rose-300 seafoam:text-cyan-900 ocean:text-cyan-300">
                    Completed Goals ({completedGoals.length})
                  </h2>
                  <div className="space-y-4">
                    {completedGoals.map((goal) => (
                      <GoalCard
                        key={goal.id}
                        goal={goal}
                        writingSessions={writingSessions}
                        onDelete={handleDeleteGoal}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Upcoming Goals */}
            <div>
              {upcomingGoals.length > 0 && (
                <>
                  <h2 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50 strawberry:text-rose-900 cherry:text-rose-300 seafoam:text-cyan-900 ocean:text-cyan-300">
                    Upcoming Goals ({upcomingGoals.length})
                  </h2>
                  <div className="space-y-4">
                    {upcomingGoals.map((goal) => (
                      <GoalCard
                        key={goal.id}
                        goal={goal}
                        writingSessions={writingSessions}
                        onDelete={handleDeleteGoal}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Empty State */}
        {goals.length === 0 && (
          <Card className="p-12 text-center">
            <h3 className="mb-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50 strawberry:text-rose-900 cherry:text-rose-300 seafoam:text-cyan-900 ocean:text-cyan-300">
              No goals yet
            </h3>
            <p className="mb-6 text-lg text-zinc-600 dark:text-zinc-400 strawberry:text-rose-700 cherry:text-rose-400 seafoam:text-cyan-700 ocean:text-cyan-400">
              Create your first writing goal to start tracking your progress
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center justify-center rounded-md bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 strawberry:bg-linear-to-r strawberry:from-rose-500 strawberry:to-pink-500 strawberry:hover:from-rose-600 strawberry:hover:to-pink-600 cherry:bg-linear-to-r cherry:from-rose-700 cherry:to-pink-700 cherry:hover:from-rose-600 cherry:hover:to-pink-600 seafoam:bg-linear-to-r seafoam:from-cyan-500 seafoam:to-blue-500 seafoam:hover:from-cyan-600 seafoam:hover:to-blue-600 ocean:bg-linear-to-r ocean:from-cyan-700 ocean:to-blue-700 ocean:hover:from-cyan-600 ocean:hover:to-blue-600"
            >
              Create Your First Goal
            </button>
          </Card>
        )}
      </div>
    </main>
  );
}
