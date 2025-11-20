import { Card } from "./ui/card";
import { ProgressBar } from "./ui/progress-bar";

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
      <ProgressBar value={percentage} size="lg" className="w-full" />
      {message && (
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 strawberry:text-rose-700 cherry:text-rose-400 seafoam:text-cyan-700 ocean:text-cyan-400">
          {message}
        </p>
      )}
    </Card>
  );
}
