"use client";

import { StatsCard } from "@/components/StatsCard";
import { ProgressCard } from "@/components/ProgressCard";
import { WeeklyCalendar } from "@/components/WeeklyCalendar";
import { PageHeader } from "@/components/PageHeader";
import { themeClasses } from "@/lib/theme-utils";
import { cn } from "@/lib/class-utils";
import type { Goal, WritingSession } from "@/lib/types";
import { useCurrentGoal } from "@/lib/use-current-goal";

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
  const { todayGoal, todayProgress, daysLeft, currentGoal } = useCurrentGoal();

  return (
    <main className={cn("min-h-screen", themeClasses.background.page)}>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <PageHeader
          title="DailyWrite"
          description="Make goals and track your daily writing progress"
          dailyGoal={todayGoal}
          daysLeft={daysLeft}
          writtenToday={todayProgress}
          goalStartDate={currentGoal?.startDate}
          goalEndDate={currentGoal?.endDate}
        />

        {/* Weekly Calendar */}
        <div className="mb-8">
          <WeeklyCalendar
            goals={goals}
            writingSessions={writingSessions}
          />
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <ProgressCard
            title="Today's Progress"
            current={todayProgress}
            goal={todayGoal}
            message={
              todayGoal - todayProgress > 0
                ? `${
                    todayGoal - todayProgress
                  } words remaining to reach your goal`
                : "Goal achieved! 🎉"
            }
          />
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard label="Current Streak" value={stats.currentStreak} subtitle="days" />
          <StatsCard
            label="Total Days Written"
            value={stats.totalDaysWritten}
            subtitle="days"
          />
          <StatsCard
            label="Avg Words/Session"
            value={stats.averageWordsPerDay}
            subtitle="words"
          />
          <StatsCard
            label="Total Words"
            value={stats.totalWords}
            subtitle="all time"
          />
        </div>
      </div>
    </main>
  );
}
