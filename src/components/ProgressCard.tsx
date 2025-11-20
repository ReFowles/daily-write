import { Card } from "./ui/Card";
import { ProgressBar } from "./ui/ProgressBar";
import { themeClasses } from "@/lib/theme-utils";
import { cn } from "@/lib/class-utils";

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
        <h2 className={cn("text-xl font-semibold", themeClasses.text.primary)}>
          {title}
        </h2>
        <span className={cn("text-sm", themeClasses.text.secondary)}>
          {Math.round(percentage)}%
        </span>
      </div>
      <ProgressBar value={percentage} size="lg" className="w-full" />
      {message && (
        <p className={cn("mt-2 text-sm", themeClasses.text.secondary)}>
          {message}
        </p>
      )}
    </Card>
  );
}
