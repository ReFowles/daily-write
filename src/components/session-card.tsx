import { Card } from "./ui/card";

interface SessionCardProps {
  title: string;
  date: string;
  wordCount: number;
  goalMet: boolean;
  preview: string;
  onView: () => void;
}

export function SessionCard({ title, date, wordCount, goalMet, preview, onView }: SessionCardProps) {
  return (
    <Card className="p-6 transition-shadow hover:shadow-md strawberry:hover:shadow-pink-200 dark-strawberry:hover:shadow-rose-900 ocean:hover:shadow-cyan-200 dark-ocean:hover:shadow-cyan-900">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 strawberry:text-rose-900 dark-strawberry:text-rose-300 ocean:text-cyan-900 dark-ocean:text-cyan-300">
              {title}
            </h3>
            {goalMet && (
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-100 strawberry:bg-rose-100 strawberry:text-rose-800 dark-strawberry:bg-rose-900 dark-strawberry:text-rose-200 ocean:bg-cyan-100 ocean:text-cyan-800 dark-ocean:bg-cyan-900 dark-ocean:text-cyan-200">
                Goal Met ✓
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400 strawberry:text-rose-600 dark-strawberry:text-rose-400 ocean:text-cyan-600 dark-ocean:text-cyan-400">
            <span>{new Date(date).toLocaleDateString("en-US", { 
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric"
            })}</span>
            <span>•</span>
            <span className="font-medium">{wordCount} words</span>
          </div>
          <p className="mt-3 text-zinc-700 dark:text-zinc-300 strawberry:text-rose-800 dark-strawberry:text-rose-400 ocean:text-cyan-800 dark-ocean:text-cyan-400">
            {preview}
          </p>
        </div>
        <button 
          onClick={onView}
          className="ml-4 rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 strawberry:border-rose-300 strawberry:text-rose-700 strawberry:hover:bg-rose-50 dark-strawberry:border-rose-800 dark-strawberry:text-rose-300 dark-strawberry:hover:bg-rose-900 ocean:border-cyan-300 ocean:text-cyan-700 ocean:hover:bg-cyan-50 dark-ocean:border-cyan-800 dark-ocean:text-cyan-300 dark-ocean:hover:bg-cyan-900"
        >
          View
        </button>
      </div>
    </Card>
  );
}
