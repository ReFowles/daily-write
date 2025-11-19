import Link from "next/link";
import { StatsCard } from "@/components/stats-card";
import { ProgressCard } from "@/components/progress-card";
import { Card } from "@/components/ui/card";

export default function Dashboard() {
  // Mock data - will be replaced with real data later
  const todayGoal = 500;
  const todayProgress = 0;
  const streak = 0;
  const totalWords = 0;

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 strawberry:bg-linear-to-br strawberry:from-pink-50 strawberry:via-rose-50 strawberry:to-pink-100 cherry:bg-linear-to-br cherry:from-zinc-950 cherry:via-rose-950 cherry:to-zinc-950 seafoam:bg-linear-to-br seafoam:from-cyan-50 seafoam:via-blue-50 seafoam:to-cyan-100 ocean:bg-linear-to-br ocean:from-zinc-950 ocean:via-cyan-950 ocean:to-zinc-950">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50 strawberry:text-rose-900 cherry:text-rose-300 seafoam:text-cyan-900 ocean:text-cyan-300">
            Dashboard
          </h1>
          <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400 strawberry:text-rose-700 cherry:text-rose-400 seafoam:text-cyan-700 ocean:text-cyan-400">
            Track your daily writing progress
          </p>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard label="Today's Goal" value={todayGoal} subtitle="words" />
          <StatsCard label="Today's Progress" value={todayProgress} subtitle="words written" />
          <StatsCard label="Current Streak" value={streak} subtitle="days" />
          <StatsCard label="Total Words" value={totalWords} subtitle="all time" />
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <ProgressCard
            title="Today's Progress"
            current={todayProgress}
            goal={todayGoal}
            message={
              todayGoal - todayProgress > 0
                ? `${todayGoal - todayProgress} words remaining to reach your goal`
                : "Goal achieved! 🎉"
            }
          />
        </div>

        {/* Quick Actions */}
        <Card className="p-6">
          <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50 strawberry:text-rose-900 cherry:text-rose-300 seafoam:text-cyan-900 ocean:text-cyan-300">
            Quick Actions
          </h2>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/write"
              className="inline-flex items-center justify-center rounded-md bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 strawberry:bg-linear-to-r strawberry:from-rose-500 strawberry:to-pink-500 strawberry:hover:from-rose-600 strawberry:hover:to-pink-600 cherry:bg-linear-to-r cherry:from-rose-700 cherry:to-pink-700 cherry:hover:from-rose-600 cherry:hover:to-pink-600 seafoam:bg-linear-to-r seafoam:from-cyan-500 seafoam:to-blue-500 seafoam:hover:from-cyan-600 seafoam:hover:to-blue-600 ocean:bg-linear-to-r ocean:from-cyan-700 ocean:to-blue-700 ocean:hover:from-cyan-600 ocean:hover:to-blue-600"
            >
              Start Writing
            </Link>
            <Link
              href="/history"
              className="inline-flex items-center justify-center rounded-md border border-zinc-300 bg-white px-6 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 strawberry:border-rose-300 strawberry:bg-white strawberry:text-rose-700 strawberry:hover:bg-rose-50 cherry:border-rose-800 cherry:bg-rose-950 cherry:text-rose-300 cherry:hover:bg-rose-900 seafoam:border-cyan-300 seafoam:bg-white seafoam:text-cyan-700 seafoam:hover:bg-cyan-50 ocean:border-cyan-800 ocean:bg-cyan-950 ocean:text-cyan-300 ocean:hover:bg-cyan-900"
            >
              View History
            </Link>
          </div>
        </Card>
      </div>
    </main>
  );
}
