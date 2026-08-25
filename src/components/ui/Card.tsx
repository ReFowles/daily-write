import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 strawberry:border-pink-200 strawberry:bg-white strawberry:shadow-sm strawberry:shadow-pink-100 cherry:border-rose-900 cherry:bg-rose-950/50 cherry:shadow-sm cherry:shadow-rose-950 seafoam:border-cyan-200 seafoam:bg-white seafoam:shadow-sm seafoam:shadow-cyan-100 ocean:border-cyan-900 ocean:bg-cyan-950/50 ocean:shadow-sm ocean:shadow-cyan-950 ${className}`}
    >
      {children}
    </div>
  );
}
