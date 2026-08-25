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
import { getAllGoals, getAllWritingSessions, createGoal, deleteGoal as deleteGoalFromDb } from "@/lib/data-store";

interface GoalsPageClientProps {
  userId: string;
}

export function GoalsPageClient({ userId }: GoalsPageClientProps) {
  const searchParams = useSearchParams();
  const { isOpen: showCreateForm, setIsOpen: setShowCreateForm } = useToggle(false);
  
  // Set initial form state from search params after mount
  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setShowCreateForm(true);
    }
  }, [searchParams, setShowCreateForm]);
  
  const [goals, setGoals] = useState<Goal[]>([]);
  const [writingSessions, setWritingSessions] = useState<WritingSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isOpen: showCompletedGoals, toggle: toggleCompletedGoals } = useToggle(true);
  const { isOpen: showUpcomingGoals, toggle: toggleUpcomingGoals } = useToggle(true);
  const { todayGoal, todayProgress, daysLeft, currentGoal } = useCurrentGoal();

  // Fetch goals and writing sessions on mount
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const [goalsData, sessionsData] = await Promise.all([
          getAllGoals(userId),
          getAllWritingSessions(userId),
        ]);
        setGoals(goalsData);
        setWritingSessions(sessionsData);
      } catch (error) {
        console.error("Error fetching goals and sessions:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [userId]);

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

  const handleCreateGoal = async (goalData: Omit<Goal, "id" | "userId">, onError: (message: string) => void) => {
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

    try {
      const newGoal = await createGoal({ ...goalData, userId });
      setGoals([newGoal, ...goals]);
      setShowCreateForm(false);
    } catch (error) {
      console.error("Error creating goal:", error);
      onError("Failed to create goal. Please try again.");
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      await deleteGoalFromDb(goalId);
      setGoals(goals.filter((goal) => goal.id !== goalId));
    } catch (error) {
      console.error("Error deleting goal:", error);
    }
  };

  if (isLoading) {
    return (
      <main className={cn("min-h-screen", themeClasses.background.page)}>
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <p className={cn("text-lg", themeClasses.text.secondary)}>Loading goals...</p>
          </div>
        </div>
      </main>
    );
  }

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
