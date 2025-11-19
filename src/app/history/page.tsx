export default function HistoryPage() {
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

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 strawberry:bg-linear-to-br strawberry:from-pink-50 strawberry:via-rose-50 strawberry:to-pink-100 dark-strawberry:bg-linear-to-br dark-strawberry:from-zinc-950 dark-strawberry:via-rose-950 dark-strawberry:to-zinc-950 ocean:bg-linear-to-br ocean:from-cyan-50 ocean:via-cyan-100 ocean:to-cyan-200 dark-ocean:bg-linear-to-br dark-ocean:from-cyan-950 dark-ocean:via-cyan-950 dark-ocean:to-cyan-950">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50 strawberry:text-rose-900 dark-strawberry:text-rose-300 ocean:text-cyan-900 dark-ocean:text-cyan-300">
            Writing History
          </h1>
          <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400 strawberry:text-rose-700 dark-strawberry:text-rose-400 ocean:text-cyan-700 dark-ocean:text-cyan-400">
            Review your past writing sessions
          </p>
        </div>

        {/* Summary Stats */}
        <div className="mb-8 grid gap-6 sm:grid-cols-3">
          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 strawberry:border-pink-200 strawberry:bg-white strawberry:shadow-sm strawberry:shadow-pink-100 dark-strawberry:border-rose-900 dark-strawberry:bg-rose-950/50 dark-strawberry:shadow-sm dark-strawberry:shadow-rose-950 ocean:border-cyan-200 ocean:bg-white ocean:shadow-sm ocean:shadow-cyan-100 dark-ocean:border-cyan-900 dark-ocean:bg-cyan-950/50 dark-ocean:shadow-sm dark-ocean:shadow-cyan-950">
            <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400 strawberry:text-rose-600 dark-strawberry:text-rose-400 ocean:text-cyan-600 dark-ocean:text-cyan-400">
              Total Sessions
            </div>
            <div className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50 strawberry:text-rose-900 dark-strawberry:text-rose-300 ocean:text-cyan-900 dark-ocean:text-cyan-300">
              {totalSessions}
            </div>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 strawberry:border-pink-200 strawberry:bg-white strawberry:shadow-sm strawberry:shadow-pink-100 dark-strawberry:border-rose-900 dark-strawberry:bg-rose-950/50 dark-strawberry:shadow-sm dark-strawberry:shadow-rose-950 ocean:border-cyan-200 ocean:bg-white ocean:shadow-sm ocean:shadow-cyan-100 dark-ocean:border-cyan-900 dark-ocean:bg-cyan-950/50 dark-ocean:shadow-sm dark-ocean:shadow-cyan-950">
            <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400 strawberry:text-rose-600 dark-strawberry:text-rose-400 ocean:text-cyan-600 dark-ocean:text-cyan-400">
              Total Words
            </div>
            <div className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50 strawberry:text-rose-900 dark-strawberry:text-rose-300 ocean:text-cyan-900 dark-ocean:text-cyan-300">
              {totalWords.toLocaleString()}
            </div>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 strawberry:border-pink-200 strawberry:bg-white strawberry:shadow-sm strawberry:shadow-pink-100 dark-strawberry:border-rose-900 dark-strawberry:bg-rose-950/50 dark-strawberry:shadow-sm dark-strawberry:shadow-rose-950 ocean:border-cyan-200 ocean:bg-white ocean:shadow-sm ocean:shadow-cyan-100 dark-ocean:border-cyan-900 dark-ocean:bg-cyan-950/50 dark-ocean:shadow-sm dark-ocean:shadow-cyan-950">
            <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400 strawberry:text-rose-600 dark-strawberry:text-rose-400 ocean:text-cyan-600 dark-ocean:text-cyan-400">
              Goals Met
            </div>
            <div className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50 strawberry:text-rose-900 dark-strawberry:text-rose-300 ocean:text-cyan-900 dark-ocean:text-cyan-300">
              {goalsMetCount}/{totalSessions}
            </div>
          </div>
        </div>

        {/* Sessions List */}
        <div className="space-y-4">
          {sessions.length === 0 ? (
            <div className="rounded-lg border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900 strawberry:border-pink-200 strawberry:bg-white strawberry:shadow-sm strawberry:shadow-pink-100 dark-strawberry:border-rose-900 dark-strawberry:bg-rose-950/50 dark-strawberry:shadow-sm dark-strawberry:shadow-rose-950 ocean:border-cyan-200 ocean:bg-white ocean:shadow-sm ocean:shadow-cyan-100 dark-ocean:border-cyan-900 dark-ocean:bg-cyan-950/50 dark-ocean:shadow-sm dark-ocean:shadow-cyan-950">
              <p className="text-lg text-zinc-600 dark:text-zinc-400 strawberry:text-rose-700 dark-strawberry:text-rose-400 ocean:text-cyan-700 dark-ocean:text-cyan-400">
                No writing sessions yet. Start writing to see your history!
              </p>
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className="rounded-lg border border-zinc-200 bg-white p-6 transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 strawberry:border-pink-200 strawberry:bg-white strawberry:shadow-sm strawberry:shadow-pink-100 strawberry:hover:shadow-pink-200 dark-strawberry:border-rose-900 dark-strawberry:bg-rose-950/50 dark-strawberry:shadow-sm dark-strawberry:shadow-rose-950 dark-strawberry:hover:shadow-rose-900 ocean:border-cyan-200 ocean:bg-white ocean:shadow-sm ocean:shadow-cyan-100 ocean:hover:shadow-cyan-200 dark-ocean:border-cyan-900 dark-ocean:bg-cyan-950/50 dark-ocean:shadow-sm dark-ocean:shadow-cyan-950 dark-ocean:hover:shadow-cyan-900"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 strawberry:text-rose-900 dark-strawberry:text-rose-300 ocean:text-cyan-900 dark-ocean:text-cyan-300">
                        {session.title}
                      </h3>
                      {session.goalMet && (
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-100 strawberry:bg-rose-100 strawberry:text-rose-800 dark-strawberry:bg-rose-900 dark-strawberry:text-rose-200 ocean:bg-cyan-100 ocean:text-cyan-800 dark-ocean:bg-cyan-900 dark-ocean:text-cyan-200">
                          Goal Met ✓
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400 strawberry:text-rose-600 dark-strawberry:text-rose-400 ocean:text-cyan-600 dark-ocean:text-cyan-400">
                      <span>{new Date(session.date).toLocaleDateString("en-US", { 
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric"
                      })}</span>
                      <span>•</span>
                      <span className="font-medium">{session.wordCount} words</span>
                    </div>
                    <p className="mt-3 text-zinc-700 dark:text-zinc-300 strawberry:text-rose-800 dark-strawberry:text-rose-400 ocean:text-cyan-800 dark-ocean:text-cyan-400">
                      {session.preview}
                    </p>
                  </div>
                  <button className="ml-4 rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 strawberry:border-rose-300 strawberry:text-rose-700 strawberry:hover:bg-rose-50 dark-strawberry:border-rose-800 dark-strawberry:text-rose-300 dark-strawberry:hover:bg-rose-900 ocean:border-cyan-300 ocean:text-cyan-700 ocean:hover:bg-cyan-50 dark-ocean:border-cyan-800 dark-ocean:text-cyan-300 dark-ocean:hover:bg-cyan-900">
                    View
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination placeholder */}
        {sessions.length > 0 && (
          <div className="mt-8 flex justify-center">
            <div className="flex gap-2">
              <button className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 strawberry:border-rose-300 strawberry:text-rose-700 strawberry:hover:bg-rose-50 dark-strawberry:border-rose-800 dark-strawberry:text-rose-300 dark-strawberry:hover:bg-rose-900 ocean:border-cyan-300 ocean:text-cyan-700 ocean:hover:bg-cyan-50 dark-ocean:border-cyan-800 dark-ocean:text-cyan-300 dark-ocean:hover:bg-cyan-900" disabled>
                Previous
              </button>
              <button className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 strawberry:border-rose-300 strawberry:text-rose-700 strawberry:hover:bg-rose-50 dark-strawberry:border-rose-800 dark-strawberry:text-rose-300 dark-strawberry:hover:bg-rose-900 ocean:border-cyan-300 ocean:text-cyan-700 ocean:hover:bg-cyan-50 dark-ocean:border-cyan-800 dark-ocean:text-cyan-300 dark-ocean:hover:bg-cyan-900" disabled>
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
