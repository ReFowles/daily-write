"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useToggle } from "@/lib/use-toggle";
import { ChevronRight } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { themeClasses } from "@/lib/theme-utils";
import { cn } from "@/lib/class-utils";
import { Card } from "@/components/ui/Card";
import { GoalCard } from "@/components/GoalCard";
import { CreateGoalForm } from "@/components/CreateGoalForm";
import { PageHeader } from "@/components/PageHeader";
import { MonthlyCalendar } from "@/components/MonthlyCalendar";
import { useCurrentGoal } from "@/lib/use-current-goal";
import { parseLocalDate } from "@/lib/date-utils";
import type { Goal, WritingSession } from "@/lib/types";
import dummyData from "@/lib/dummy-data.json";

export function GoalsPageClient() {
  const searchParams = useSearchParams();
  const { isOpen: showCreateForm, setIsOpen: setShowCreateForm } = useToggle(false);
  
  // Set initial form state from search params after mount
  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setShowCreateForm(true);
    }
  }, [searchParams, setShowCreateForm]);
  
  const [goals, setGoals] = useState<Goal[]>(dummyData.goals as unknown as Goal[]);
  const [writingSessions] = useState<WritingSession[]>(dummyData.writingSessions as unknown as WritingSession[]);
  const { isOpen: showCompletedGoals, toggle: toggleCompletedGoals } = useToggle(true);
  const { isOpen: showUpcomingGoals, toggle: toggleUpcomingGoals } = useToggle(true);
  const { todayGoal, todayProgress, daysLeft, currentGoal } = useCurrentGoal();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const currentGoals = goals.filter((goal) => {
    const startDate = parseLocalDate(goal.startDate);
    const endDate = parseLocalDate(goal.endDate);
    return startDate <= today && endDate >= today;
  });
  
  const upcomingGoals = goals.filter((goal) => {
    const startDate = parseLocalDate(goal.startDate);
    return startDate > today;
  });
  
  const completedGoals = goals
    .filter((goal) => parseLocalDate(goal.endDate) < today)
    .sort((a, b) => parseLocalDate(b.endDate).getTime() - parseLocalDate(a.endDate).getTime());

  const handleCreateGoal = (goalData: Omit<Goal, "id">, onError: (message: string) => void) => {
    const newStart = parseLocalDate(goalData.startDate);
    const newEnd = parseLocalDate(goalData.endDate);

    // Check for overlapping goals
    const hasOverlap = goals.some((goal) => {
      const existingStart = parseLocalDate(goal.startDate);
      const existingEnd = parseLocalDate(goal.endDate);
      
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
    <main className={cn("min-h-screen", themeClasses.background.page)}>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <PageHeader
          title="Writing Goals"
          description="Set and track your writing objectives"
          dailyGoal={todayGoal}
          daysLeft={daysLeft}
          writtenToday={todayProgress}
          goalStartDate={currentGoal?.startDate}
          goalEndDate={currentGoal?.endDate}
          onNewGoalClick={() => setShowCreateForm(!showCreateForm)}
          newGoalButtonText={showCreateForm ? "Cancel" : "New Goal"}
        />

        {/* Create Goal Form */}
        {showCreateForm && (
          <div className="mb-8">
            <CreateGoalForm
              onSubmit={handleCreateGoal}
              onCancel={() => setShowCreateForm(false)}
              goals={goals}
              writingSessions={writingSessions}
            />
          </div>
        )}

        {/* Monthly Calendar */}
        {goals.length > 0 && (
          <div className="mb-8">
            <MonthlyCalendar goals={goals} writingSessions={writingSessions} />
          </div>
        )}

        {/* Current Goal */}
        {currentGoals.length > 0 && (
          <div className="mb-8">
            <h2 className={cn("mb-4 text-2xl font-semibold", themeClasses.text.primary)}>
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
                  <button
                    onClick={toggleCompletedGoals}
                    className={cn("mb-4 flex w-full items-center gap-2 text-2xl font-semibold transition-opacity hover:opacity-70", themeClasses.text.primary)}
                    aria-expanded={showCompletedGoals}
                    aria-label={showCompletedGoals ? "Collapse completed goals" : "Expand completed goals"}
                  >
                    <ChevronRight className={`transition-transform ${showCompletedGoals ? "rotate-90" : ""}`} />
                    Completed Goals ({completedGoals.length})
                  </button>
                  {showCompletedGoals && (
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
                  )}
                </>
              )}
            </div>

            {/* Upcoming Goals */}
            <div>
              {upcomingGoals.length > 0 && (
                <>
                  <button
                    onClick={toggleUpcomingGoals}
                    className={cn("mb-4 flex w-full items-center gap-2 text-2xl font-semibold transition-opacity hover:opacity-70", themeClasses.text.primary)}
                    aria-expanded={showUpcomingGoals}
                    aria-label={showUpcomingGoals ? "Collapse upcoming goals" : "Expand upcoming goals"}
                  >
                    <ChevronRight className={`transition-transform ${showUpcomingGoals ? "rotate-90" : ""}`} />
                    Upcoming Goals ({upcomingGoals.length})
                  </button>
                  {showUpcomingGoals && (
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
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Empty State */}
        {goals.length === 0 && (
          <Card className="p-12 text-center">
            <h3 className={cn("mb-2 text-xl font-semibold", themeClasses.text.primary)}>
              No goals yet
            </h3>
            <p className={cn("mb-6 text-lg", themeClasses.text.secondary)}>
              Create your first writing goal to start tracking your progress
            </p>
            <Button
              variant="primary"
              size="lg"
              onClick={() => setShowCreateForm(true)}
            >
              Create Your First Goal
            </Button>
          </Card>
        )}
      </div>
    </main>
  );
}
