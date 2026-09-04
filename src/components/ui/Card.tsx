import { ReactNode } from "react";
import { cn } from "@/lib/class-utils";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <div className={cn("themed-card rounded-lg", className)}>{children}</div>
  );
}
