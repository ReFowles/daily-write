import Link from "next/link";

export default function Dashboard() {
  // Mock data - will be replaced with real data later
  const todayGoal = 500;
  const todayProgress = 0;
  const streak = 0;
  const totalWords = 0;

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 strawberry:bg-linear-to-br strawberry:from-pink-50 strawberry:via-rose-50 strawberry:to-pink-100 dark-strawberry:bg-linear-to-br dark-strawberry:from-zinc-950 dark-strawberry:via-rose-950 dark-strawberry:to-zinc-950 ocean:bg-linear-to-br ocean:from-cyan-50 ocean:via-blue-50 ocean:to-cyan-100 dark-ocean:bg-linear-to-br dark-ocean:from-zinc-950 dark-ocean:via-cyan-950 dark-ocean:to-zinc-950">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50 strawberry:text-rose-900 dark-strawberry:text-rose-300 ocean:text-cyan-900 dark-ocean:text-cyan-300">
            Dashboard
          </h1>
          <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400 strawberry:text-rose-700 dark-strawberry:text-rose-400 ocean:text-cyan-700 dark-ocean:text-cyan-400">
            Track your daily writing progress
          </p>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 strawberry:border-pink-200 strawberry:bg-white strawberry:shadow-sm strawberry:shadow-pink-100 dark-strawberry:border-rose-900 dark-strawberry:bg-rose-950/50 dark-strawberry:shadow-sm dark-strawberry:shadow-rose-950 ocean:border-cyan-200 ocean:bg-white ocean:shadow-sm ocean:shadow-cyan-100 dark-ocean:border-cyan-900 dark-ocean:bg-cyan-950/50 dark-ocean:shadow-sm dark-ocean:shadow-cyan-950">
            <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400 strawberry:text-rose-600 dark-strawberry:text-rose-400 ocean:text-cyan-600 dark-ocean:text-cyan-400">
              Today's Goal
            </div>
            <div className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50 strawberry:text-rose-900 dark-strawberry:text-rose-300 ocean:text-cyan-900 dark-ocean:text-cyan-300">
              {todayGoal}
            </div>
            <div className="mt-1 text-sm text-zinc-500 dark:text-zinc-500 strawberry:text-rose-500 dark-strawberry:text-rose-500 ocean:text-cyan-500 dark-ocean:text-cyan-500">
              words
            </div>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 strawberry:border-pink-200 strawberry:bg-white strawberry:shadow-sm strawberry:shadow-pink-100 dark-strawberry:border-rose-900 dark-strawberry:bg-rose-950/50 dark-strawberry:shadow-sm dark-strawberry:shadow-rose-950 ocean:border-cyan-200 ocean:bg-white ocean:shadow-sm ocean:shadow-cyan-100 dark-ocean:border-cyan-900 dark-ocean:bg-cyan-950/50 dark-ocean:shadow-sm dark-ocean:shadow-cyan-950">
            <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400 strawberry:text-rose-600 dark-strawberry:text-rose-400 ocean:text-cyan-600 dark-ocean:text-cyan-400">
              Today's Progress
            </div>
            <div className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50 strawberry:text-rose-900 dark-strawberry:text-rose-300 ocean:text-cyan-900 dark-ocean:text-cyan-300">
              {todayProgress}
            </div>
            <div className="mt-1 text-sm text-zinc-500 dark:text-zinc-500 strawberry:text-rose-500 dark-strawberry:text-rose-500 ocean:text-cyan-500 dark-ocean:text-cyan-500">
              words written
            </div>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 strawberry:border-pink-200 strawberry:bg-white strawberry:shadow-sm strawberry:shadow-pink-100 dark-strawberry:border-rose-900 dark-strawberry:bg-rose-950/50 dark-strawberry:shadow-sm dark-strawberry:shadow-rose-950 ocean:border-cyan-200 ocean:bg-white ocean:shadow-sm ocean:shadow-cyan-100 dark-ocean:border-cyan-900 dark-ocean:bg-cyan-950/50 dark-ocean:shadow-sm dark-ocean:shadow-cyan-950">
            <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400 strawberry:text-rose-600 dark-strawberry:text-rose-400 ocean:text-cyan-600 dark-ocean:text-cyan-400">
              Current Streak
            </div>
            <div className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50 strawberry:text-rose-900 dark-strawberry:text-rose-300 ocean:text-cyan-900 dark-ocean:text-cyan-300">
              {streak}
            </div>
            <div className="mt-1 text-sm text-zinc-500 dark:text-zinc-500 strawberry:text-rose-500 dark-strawberry:text-rose-500 ocean:text-cyan-500 dark-ocean:text-cyan-500">
              days
            </div>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 strawberry:border-pink-200 strawberry:bg-white strawberry:shadow-sm strawberry:shadow-pink-100 dark-strawberry:border-rose-900 dark-strawberry:bg-rose-950/50 dark-strawberry:shadow-sm dark-strawberry:shadow-rose-950 ocean:border-cyan-200 ocean:bg-white ocean:shadow-sm ocean:shadow-cyan-100 dark-ocean:border-cyan-900 dark-ocean:bg-cyan-950/50 dark-ocean:shadow-sm dark-ocean:shadow-cyan-950">
            <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400 strawberry:text-rose-600 dark-strawberry:text-rose-400 ocean:text-cyan-600 dark-ocean:text-cyan-400">
              Total Words
            </div>
            <div className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50 strawberry:text-rose-900 dark-strawberry:text-rose-300 ocean:text-cyan-900 dark-ocean:text-cyan-300">
              {totalWords}
            </div>
            <div className="mt-1 text-sm text-zinc-500 dark:text-zinc-500 strawberry:text-rose-500 dark-strawberry:text-rose-500 ocean:text-cyan-500 dark-ocean:text-cyan-500">
              all time
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 strawberry:border-pink-200 strawberry:bg-white strawberry:shadow-sm strawberry:shadow-pink-100 dark-strawberry:border-rose-900 dark-strawberry:bg-rose-950/50 dark-strawberry:shadow-sm dark-strawberry:shadow-rose-950 ocean:border-cyan-200 ocean:bg-white ocean:shadow-sm ocean:shadow-cyan-100 dark-ocean:border-cyan-900 dark-ocean:bg-cyan-950/50 dark-ocean:shadow-sm dark-ocean:shadow-cyan-950">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 strawberry:text-rose-900 dark-strawberry:text-rose-300 ocean:text-cyan-900 dark-ocean:text-cyan-300">
              Today's Progress
            </h2>
            <span className="text-sm text-zinc-600 dark:text-zinc-400 strawberry:text-rose-600 dark-strawberry:text-rose-400 ocean:text-cyan-600 dark-ocean:text-cyan-400">
              {Math.round((todayProgress / todayGoal) * 100)}%
            </span>
          </div>
          <div className="h-4 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800 strawberry:bg-pink-200 dark-strawberry:bg-rose-900 ocean:bg-cyan-200 dark-ocean:bg-cyan-900">
            <div
              className="h-full bg-blue-600 transition-all duration-300 strawberry:bg-linear-to-r strawberry:from-rose-500 strawberry:to-pink-500 dark-strawberry:bg-linear-to-r dark-strawberry:from-rose-600 dark-strawberry:to-pink-600 ocean:bg-linear-to-r ocean:from-cyan-500 ocean:to-blue-500 dark-ocean:bg-linear-to-r dark-ocean:from-cyan-600 dark-ocean:to-blue-600"
              style={{ width: `${Math.min((todayProgress / todayGoal) * 100, 100)}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 strawberry:text-rose-700 dark-strawberry:text-rose-400 ocean:text-cyan-700 dark-ocean:text-cyan-400">
            {todayGoal - todayProgress > 0
              ? `${todayGoal - todayProgress} words remaining to reach your goal`
              : "Goal achieved! 🎉"}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 strawberry:border-pink-200 strawberry:bg-white strawberry:shadow-sm strawberry:shadow-pink-100 dark-strawberry:border-rose-900 dark-strawberry:bg-rose-950/50 dark-strawberry:shadow-sm dark-strawberry:shadow-rose-950 ocean:border-cyan-200 ocean:bg-white ocean:shadow-sm ocean:shadow-cyan-100 dark-ocean:border-cyan-900 dark-ocean:bg-cyan-950/50 dark-ocean:shadow-sm dark-ocean:shadow-cyan-950">
          <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50 strawberry:text-rose-900 dark-strawberry:text-rose-300 ocean:text-cyan-900 dark-ocean:text-cyan-300">
            Quick Actions
          </h2>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/write"
              className="inline-flex items-center justify-center rounded-md bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 strawberry:bg-linear-to-r strawberry:from-rose-500 strawberry:to-pink-500 strawberry:hover:from-rose-600 strawberry:hover:to-pink-600 dark-strawberry:bg-linear-to-r dark-strawberry:from-rose-700 dark-strawberry:to-pink-700 dark-strawberry:hover:from-rose-600 dark-strawberry:hover:to-pink-600 ocean:bg-linear-to-r ocean:from-cyan-500 ocean:to-blue-500 ocean:hover:from-cyan-600 ocean:hover:to-blue-600 dark-ocean:bg-linear-to-r dark-ocean:from-cyan-700 dark-ocean:to-blue-700 dark-ocean:hover:from-cyan-600 dark-ocean:hover:to-blue-600"
            >
              Start Writing
            </Link>
            <Link
              href="/history"
              className="inline-flex items-center justify-center rounded-md border border-zinc-300 bg-white px-6 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 strawberry:border-rose-300 strawberry:bg-white strawberry:text-rose-700 strawberry:hover:bg-rose-50 dark-strawberry:border-rose-800 dark-strawberry:bg-rose-950 dark-strawberry:text-rose-300 dark-strawberry:hover:bg-rose-900 ocean:border-cyan-300 ocean:bg-white ocean:text-cyan-700 ocean:hover:bg-cyan-50 dark-ocean:border-cyan-800 dark-ocean:bg-cyan-950 dark-ocean:text-cyan-300 dark-ocean:hover:bg-cyan-900"
            >
              View History
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
