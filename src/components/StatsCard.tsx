import { Card } from "./ui/Card";

interface StatsCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
}

export function StatsCard({ label, value, subtitle }: StatsCardProps) {
  return (
    <Card className="p-6">
      <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400 strawberry:text-rose-600 cherry:text-rose-400 seafoam:text-cyan-600 ocean:text-cyan-400">
        {label}
      </div>
      <div className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50 strawberry:text-rose-900 cherry:text-rose-300 seafoam:text-cyan-900 ocean:text-cyan-300">
        {value}
      </div>
      {subtitle && (
        <div className="mt-1 text-sm text-zinc-500 dark:text-zinc-500 strawberry:text-rose-500 cherry:text-rose-500 seafoam:text-cyan-500 ocean:text-cyan-500">
          {subtitle}
        </div>
      )}
    </Card>
  );
}
