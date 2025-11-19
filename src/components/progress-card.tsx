import { Card } from "./ui/card";

interface ProgressCardProps {
  title: string;
  current: number;
  goal: number;
  message?: string;
}

export function ProgressCard({ title, current, goal, message }: ProgressCardProps) {
  const percentage = Math.min((current / goal) * 100, 100);

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 strawberry:text-rose-900 cherry:text-rose-300 seafoam:text-cyan-900 ocean:text-cyan-300">
          {title}
        </h2>
        <span className="text-sm text-zinc-600 dark:text-zinc-400 strawberry:text-rose-600 cherry:text-rose-400 seafoam:text-cyan-600 ocean:text-cyan-400">
          {Math.round(percentage)}%
        </span>
      </div>
      <div className="h-4 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800 strawberry:bg-pink-200 cherry:bg-rose-900 seafoam:bg-cyan-200 ocean:bg-cyan-900">
        <div
          className="h-full bg-blue-600 transition-all duration-300 strawberry:bg-linear-to-r strawberry:from-rose-500 strawberry:to-pink-500 cherry:bg-linear-to-r cherry:from-rose-600 cherry:to-pink-600 seafoam:bg-linear-to-r seafoam:from-cyan-500 seafoam:to-blue-500 ocean:bg-linear-to-r ocean:from-cyan-600 ocean:to-blue-600"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {message && (
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 strawberry:text-rose-700 cherry:text-rose-400 seafoam:text-cyan-700 ocean:text-cyan-400">
          {message}
        </p>
      )}
    </Card>
  );
}
