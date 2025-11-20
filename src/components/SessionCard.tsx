import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { themeClasses } from "@/lib/theme-utils";
import { cn } from "@/lib/class-utils";

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
    <Card className={cn("p-6 transition-shadow", themeClasses.shadow.hover)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h3 className={cn("text-xl font-semibold", themeClasses.text.primary)}>
              {title}
            </h3>
            {goalMet && (
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-100 strawberry:bg-rose-100 strawberry:text-rose-800 cherry:bg-rose-900 cherry:text-rose-200 seafoam:bg-cyan-100 seafoam:text-cyan-800 ocean:bg-cyan-900 ocean:text-cyan-200">
                Goal Met ✓
              </span>
            )}
          </div>
          <div className={cn("mt-1 flex items-center gap-4 text-sm", themeClasses.text.secondary)}>
            <span>{new Date(date).toLocaleDateString("en-US", { 
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric"
            })}</span>
            <span>•</span>
            <span className="font-medium">{wordCount} words</span>
          </div>
          <p className={cn("mt-3", themeClasses.text.body)}>
            {preview}
          </p>
        </div>
        <Button variant="secondary" onClick={onView} className="ml-4">
          View
        </Button>
      </div>
    </Card>
  );
}
