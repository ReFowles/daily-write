import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 strawberry:border-pink-200 strawberry:bg-white strawberry:shadow-sm strawberry:shadow-pink-100 dark-strawberry:border-rose-900 dark-strawberry:bg-rose-950/50 dark-strawberry:shadow-sm dark-strawberry:shadow-rose-950 ocean:border-cyan-200 ocean:bg-white ocean:shadow-sm ocean:shadow-cyan-100 dark-ocean:border-cyan-900 dark-ocean:bg-cyan-950/50 dark-ocean:shadow-sm dark-ocean:shadow-cyan-950 ${className}`}
    >
      {children}
    </div>
  );
}
