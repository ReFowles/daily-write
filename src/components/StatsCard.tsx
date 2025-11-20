import { Card } from "./ui/Card";
import { themeClasses } from "@/lib/theme-utils";
import { cn } from "@/lib/class-utils";

interface StatsCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
}

export function StatsCard({ label, value, subtitle }: StatsCardProps) {
  return (
    <Card className="p-6">
      <div className={cn("text-sm font-medium", themeClasses.text.secondary)}>
        {label}
      </div>
      <div className={cn("mt-2 text-3xl font-bold", themeClasses.text.primary)}>
        {value}
      </div>
      {subtitle && (
        <div className={cn("mt-1 text-sm", themeClasses.text.tertiary)}>
          {subtitle}
        </div>
      )}
    </Card>
  );
}
