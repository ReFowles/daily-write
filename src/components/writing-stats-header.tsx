import { Card } from "./ui/card";

interface WritingStatsHeaderProps {
  wordCount: number;
  goal: number;
  onSave: () => void;
  isSaving: boolean;
  disabled: boolean;
}

export function WritingStatsHeader({ 
  wordCount, 
  goal, 
  onSave, 
  isSaving, 
  disabled 
}: WritingStatsHeaderProps) {
  const progress = Math.min((wordCount / goal) * 100, 100);

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400 strawberry:text-rose-600 dark-strawberry:text-rose-400 ocean:text-cyan-600 dark-ocean:text-cyan-400">
              Word Count
            </div>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 strawberry:text-rose-900 dark-strawberry:text-rose-300 ocean:text-cyan-900 dark-ocean:text-cyan-300">
              {wordCount}
            </div>
          </div>
          <div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400 strawberry:text-rose-600 dark-strawberry:text-rose-400 ocean:text-cyan-600 dark-ocean:text-cyan-400">
              Goal
            </div>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 strawberry:text-rose-900 dark-strawberry:text-rose-300 ocean:text-cyan-900 dark-ocean:text-cyan-300">
              {goal}
            </div>
          </div>
          <div className="flex-1">
            <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-1 strawberry:text-rose-600 dark-strawberry:text-rose-400 ocean:text-cyan-600 dark-ocean:text-cyan-400">
              Progress
            </div>
            <div className="h-2 w-48 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800 strawberry:bg-pink-200 dark-strawberry:bg-rose-900 ocean:bg-cyan-200 dark-ocean:bg-cyan-900">
              <div
                className="h-full bg-blue-600 transition-all duration-300 strawberry:bg-linear-to-r strawberry:from-rose-500 strawberry:to-pink-500 dark-strawberry:bg-linear-to-r dark-strawberry:from-rose-600 dark-strawberry:to-pink-600 ocean:bg-linear-to-r ocean:from-cyan-500 ocean:to-blue-500 dark-ocean:bg-linear-to-r dark-ocean:from-cyan-600 dark-ocean:to-blue-600"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
        <button
          onClick={onSave}
          disabled={disabled || isSaving}
          className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed strawberry:bg-linear-to-r strawberry:from-rose-500 strawberry:to-pink-500 strawberry:hover:from-rose-600 strawberry:hover:to-pink-600 dark-strawberry:bg-linear-to-r dark-strawberry:from-rose-700 dark-strawberry:to-pink-700 dark-strawberry:hover:from-rose-600 dark-strawberry:hover:to-pink-600 ocean:bg-linear-to-r ocean:from-cyan-500 ocean:to-blue-500 ocean:hover:from-cyan-600 ocean:hover:to-blue-600 dark-ocean:bg-linear-to-r dark-ocean:from-cyan-700 dark-ocean:to-blue-700 dark-ocean:hover:from-cyan-600 dark-ocean:hover:to-blue-600"
        >
          {isSaving ? "Saving..." : "Save"}
        </button>
      </div>
    </Card>
  );
}
