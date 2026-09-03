"use client";

import { useMemo, useState } from "react";
import { LuLock, LuLockOpen } from "react-icons/lu";
import { StatsCard } from "./StatsCard";
import { ProgressCard } from "./ProgressCard";
import { WeeklyCalendar } from "./WeeklyCalendar";
import { PageHeader } from "@/components/PageHeader";
import { GoalCard } from "@/components/GoalCard";
import { SortableCards, type SortableCardItem } from "./SortableCards";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { themeClasses } from "@/lib/theme-utils";
import { cn } from "@/lib/class-utils";
import { formatWordCount } from "@/lib/format-utils";
import type { Goal, WritingSession } from "@/lib/types";
import { useCurrentGoal, invalidateCurrentGoalCache } from "@/lib/use-current-goal";
import { deleteGoal as deleteGoalFromDb } from "@/lib/data-store";
import {
  booleanFromLocalStorage,
  useLocalStorageState,
} from "@/lib/use-local-storage-state";

interface DashboardClientProps {
  goals: Goal[];
  writingSessions: WritingSession[];
  stats: {
    totalWords: number;
    totalDaysWritten: number;
    averageWordsPerDay: number;
    currentStreak: number;
  };
}

export function DashboardClient({ goals, writingSessions, stats }: DashboardClientProps) {
  const { todayGoal, todayProgress, daysLeft, currentGoal, isLoading } = useCurrentGoal();
  const [localGoals, setLocalGoals] = useState<Goal[]>(goals);
  const [rearrangeLocked, setRearrangeLocked] = useLocalStorageState<boolean>(
    "dashboard-rearrange-locked",
    true,
    booleanFromLocalStorage
  );

  const activeGoal = useMemo(
    () => (currentGoal ? localGoals.find((g) => g.id === currentGoal.id) ?? currentGoal : undefined),
    [currentGoal, localGoals]
  );

  const handleDeleteGoal = async (goalId: string) => {
    try {
      await deleteGoalFromDb(goalId);
      setLocalGoals((prev) => prev.filter((g) => g.id !== goalId));
      invalidateCurrentGoalCache();
    } catch (error) {
      console.error("Error deleting goal:", error);
    }
  };

  const statsItems: SortableCardItem[] = [
    {
      id: "streak",
      content: (
        <StatsCard label="Current Streak" value={stats.currentStreak} subtitle="days" />
      ),
    },
    {
      id: "days-written",
      content: (
        <StatsCard
          label="Total Days Written"
          value={stats.totalDaysWritten}
          subtitle="days"
        />
      ),
    },
    {
      id: "avg-words",
      content: (
        <StatsCard
          label="Avg Words/Session"
          value={formatWordCount(stats.averageWordsPerDay)}
          subtitle="words"
        />
      ),
    },
    {
      id: "total-words",
      content: (
        <StatsCard
          label="Total Words"
          value={formatWordCount(stats.totalWords)}
          subtitle="all time"
        />
      ),
    },
  ];

  // Default order (top → bottom): Current Goal, This Week, Today's Progress, Stats.
  const cards: SortableCardItem[] = [];

  if (activeGoal) {
    cards.push({
      id: "current-goal",
      content: (
        <GoalCard
          goal={activeGoal}
          writingSessions={writingSessions}
          onDelete={handleDeleteGoal}
        />
      ),
    });
  }

  cards.push({
    id: "weekly",
    content: (
      <WeeklyCalendar goals={localGoals} writingSessions={writingSessions} />
    ),
  });

  cards.push({
    id: "progress",
    content: (
      <ProgressCard
        title="Today's Progress"
        current={todayProgress}
        goal={todayGoal}
        message={
          todayGoal - todayProgress > 0
            ? `${formatWordCount(
                todayGoal - todayProgress
              )} words remaining to reach your goal`
            : "Goal achieved! 🎉"
        }
      />
    ),
  });

  cards.push({
    id: "stats",
    content: (
      <Card className="p-6">
        <h2 className={cn("mb-4 text-xl font-semibold", themeClasses.text.primary)}>
          Statistics
        </h2>
        <SortableCards
          items={statsItems}
          storageKey="dashboard-stats-order:v2"
          layout="grid"
          locked={rearrangeLocked}
        />
      </Card>
    ),
  });

  const RearrangeIcon = rearrangeLocked ? LuLock : LuLockOpen;
  const rearrangeControls = (
    <span className="flex flex-wrap items-center gap-3">
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setRearrangeLocked((prev) => !prev)}
        aria-label={rearrangeLocked ? "Unlock card rearranging" : "Lock card rearranging"}
      >
        <span className="inline-flex items-center gap-2">
          <RearrangeIcon className="h-4 w-4" aria-hidden="true" />
          Rearrange
        </span>
      </Button>
    </span>
  );

  return (
    <main className={cn("min-h-screen", themeClasses.background.page)}>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-12 lg:px-8">
        <PageHeader
          title="DailyWrite"
          description={rearrangeControls}
          dailyGoal={todayGoal}
          daysLeft={daysLeft}
          writtenToday={todayProgress}
          goalStartDate={currentGoal?.startDate}
          goalEndDate={currentGoal?.endDate}
          isLoading={isLoading}
        />

        <SortableCards
          items={cards}
          storageKey="dashboard-card-order:v2"
          locked={rearrangeLocked}
        />
      </div>
    </main>
  );
}
