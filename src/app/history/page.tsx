"use client";

import { StatsCard } from "@/components/StatsCard";
import { SessionCard } from "@/components/SessionCard";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/PageHeader";
import { useCurrentGoal } from "@/lib/use-current-goal";

export default function HistoryPage() {
  const { todayGoal, todayProgress, daysLeft, currentGoal } = useCurrentGoal();

  // Mock data - will be replaced with real data later
  const sessions = [
    {
      id: "1",
      date: "2025-11-19",
      title: "Morning Writing Session",
      wordCount: 523,
      goalMet: true,
      preview: "Today I explored the depths of character development...",
    },
    {
      id: "2",
      date: "2025-11-18",
      title: "Evening Thoughts",
      wordCount: 342,
      goalMet: false,
      preview: "The narrative structure needs more work, especially...",
    },
    {
      id: "3",
      date: "2025-11-17",
      title: "Chapter 3 Draft",
      wordCount: 678,
      goalMet: true,
      preview: "As the protagonist entered the old mansion, shadows...",
    },
  ];

  const totalSessions = sessions.length;
  const totalWords = sessions.reduce((sum, session) => sum + session.wordCount, 0);
  const goalsMetCount = sessions.filter((s) => s.goalMet).length;

  const handleViewSession = (sessionId: string) => {
    // TODO: Implement view session functionality
    console.log("Viewing session:", sessionId);
  };

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 strawberry:bg-linear-to-br strawberry:from-pink-50 strawberry:via-rose-50 strawberry:to-pink-100 cherry:bg-linear-to-br cherry:from-zinc-950 cherry:via-rose-950 cherry:to-zinc-950 seafoam:bg-linear-to-br seafoam:from-cyan-50 seafoam:via-blue-50 seafoam:to-cyan-100 ocean:bg-linear-to-br ocean:from-zinc-950 ocean:via-cyan-950 ocean:to-zinc-950">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <PageHeader
          title="Writing History"
          description="Review your past writing sessions"
          dailyGoal={todayGoal}
          daysLeft={daysLeft}
          writtenToday={todayProgress}
          goalStartDate={currentGoal?.startDate}
          goalEndDate={currentGoal?.endDate}
        />

        {/* Summary Stats */}
        <div className="mb-8 grid gap-6 sm:grid-cols-3">
          <StatsCard label="Total Sessions" value={totalSessions} />
          <StatsCard label="Total Words" value={totalWords.toLocaleString()} />
          <StatsCard label="Goals Met" value={`${goalsMetCount}/${totalSessions}`} />
        </div>

        {/* Sessions List */}
        <div className="space-y-4">
          {sessions.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-lg text-zinc-600 dark:text-zinc-400 strawberry:text-rose-700 cherry:text-rose-400 seafoam:text-cyan-700 ocean:text-cyan-400">
                No writing sessions yet. Start writing to see your history!
              </p>
            </Card>
          ) : (
            sessions.map((session) => (
              <SessionCard
                key={session.id}
                title={session.title}
                date={session.date}
                wordCount={session.wordCount}
                goalMet={session.goalMet}
                preview={session.preview}
                onView={() => handleViewSession(session.id)}
              />
            ))
          )}
        </div>

        {/* Pagination placeholder */}
        {sessions.length > 0 && (
          <div className="mt-8 flex justify-center">
            <div className="flex gap-2">
              <button className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 strawberry:border-rose-300 strawberry:text-rose-700 strawberry:hover:bg-rose-50 cherry:border-rose-800 cherry:text-rose-300 cherry:hover:bg-rose-900 seafoam:border-cyan-300 seafoam:text-cyan-700 seafoam:hover:bg-cyan-50 ocean:border-cyan-800 ocean:text-cyan-300 ocean:hover:bg-cyan-900" disabled>
                Previous
              </button>
              <button className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 strawberry:border-rose-300 strawberry:text-rose-700 strawberry:hover:bg-rose-50 cherry:border-rose-800 cherry:text-rose-300 cherry:hover:bg-rose-900 seafoam:border-cyan-300 seafoam:text-cyan-700 seafoam:hover:bg-cyan-50 ocean:border-cyan-800 ocean:text-cyan-300 ocean:hover:bg-cyan-900" disabled>
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
