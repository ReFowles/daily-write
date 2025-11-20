import Link from "next/link";
import { Card } from "./ui/Card";
import { ProgressBar } from "./ui/ProgressBar";
import { Button } from "./ui/Button";
import { themeClasses } from "@/lib/theme-utils";
import { cn } from "@/lib/class-utils";

interface ProgressCardProps {
  title: string;
  current: number;
  goal: number;
  message?: string;
}

export function ProgressCard({ title, current, goal, message }: ProgressCardProps) {
  const percentage = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;

  // Show a helpful message when no goal is set
  if (goal === 0) {
    return (
      <Card className="p-6">
        <h2 className={cn("mb-4 text-xl font-semibold", themeClasses.text.primary)}>
          {title}
        </h2>
        <div className={cn("mb-4 text-center py-6", themeClasses.text.secondary)}>
          <p className="mb-4">
            You don&apos;t have an active goal yet. Set a goal to track your daily progress!
          </p>
          <Link href="/goals?new=true">
            <Button variant="primary">Create a Goal</Button>
          </Link>
        </div>
      </Card>
    );
  }

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
