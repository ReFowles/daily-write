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
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 strawberry:text-rose-900 dark-strawberry:text-rose-300 ocean:text-cyan-900 dark-ocean:text-cyan-300">
          {title}
        </h2>
        <span className="text-sm text-zinc-600 dark:text-zinc-400 strawberry:text-rose-600 dark-strawberry:text-rose-400 ocean:text-cyan-600 dark-ocean:text-cyan-400">
          {Math.round(percentage)}%
        </span>
      </div>
      <div className="h-4 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800 strawberry:bg-pink-200 dark-strawberry:bg-rose-900 ocean:bg-cyan-200 dark-ocean:bg-cyan-900">
        <div
          className="h-full bg-blue-600 transition-all duration-300 strawberry:bg-linear-to-r strawberry:from-rose-500 strawberry:to-pink-500 dark-strawberry:bg-linear-to-r dark-strawberry:from-rose-600 dark-strawberry:to-pink-600 ocean:bg-linear-to-r ocean:from-cyan-500 ocean:to-blue-500 dark-ocean:bg-linear-to-r dark-ocean:from-cyan-600 dark-ocean:to-blue-600"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {message && (
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 strawberry:text-rose-700 dark-strawberry:text-rose-400 ocean:text-cyan-700 dark-ocean:text-cyan-400">
          {message}
        </p>
      )}
    </Card>
  );
}
