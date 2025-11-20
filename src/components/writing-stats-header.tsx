import { Card } from "./ui/card";
import { ProgressBar } from "./ui/progress-bar";

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
            <div className="text-sm text-zinc-600 dark:text-zinc-400 strawberry:text-rose-600 cherry:text-rose-400 seafoam:text-cyan-600 ocean:text-cyan-400">
              Word Count
            </div>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 strawberry:text-rose-900 cherry:text-rose-300 seafoam:text-cyan-900 ocean:text-cyan-300">
              {wordCount}
            </div>
          </div>
          <div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400 strawberry:text-rose-600 cherry:text-rose-400 seafoam:text-cyan-600 ocean:text-cyan-400">
              Goal
            </div>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 strawberry:text-rose-900 cherry:text-rose-300 seafoam:text-cyan-900 ocean:text-cyan-300">
              {goal}
            </div>
          </div>
          <div className="flex-1">
            <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-1 strawberry:text-rose-600 cherry:text-rose-400 seafoam:text-cyan-600 ocean:text-cyan-400">
              Progress
            </div>
            <ProgressBar value={progress} size="sm" className="w-48" />
          </div>
        </div>
        <button
          onClick={onSave}
          disabled={disabled || isSaving}
          className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed strawberry:bg-linear-to-r strawberry:from-rose-500 strawberry:to-pink-500 strawberry:hover:from-rose-600 strawberry:hover:to-pink-600 cherry:bg-linear-to-r cherry:from-rose-700 cherry:to-pink-700 cherry:hover:from-rose-600 cherry:hover:to-pink-600 seafoam:bg-linear-to-r seafoam:from-cyan-500 seafoam:to-blue-500 seafoam:hover:from-cyan-600 seafoam:hover:to-blue-600 ocean:bg-linear-to-r ocean:from-cyan-700 ocean:to-blue-700 ocean:hover:from-cyan-600 ocean:hover:to-blue-600"
        >
          {isSaving ? "Saving..." : "Save"}
        </button>
      </div>
    </Card>
  );
}
