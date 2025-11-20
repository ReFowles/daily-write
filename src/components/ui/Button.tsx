import { ReactNode } from "react";
import { cn } from "@/lib/class-utils";

interface ButtonProps {
  variant?: "primary" | "secondary" | "icon";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  className?: string;
  disabled?: boolean;
  "aria-label"?: string;
}

export function Button({
  variant = "primary",
  size = "md",
  children,
  onClick,
  type = "button",
  className = "",
  disabled = false,
  "aria-label": ariaLabel,
}: ButtonProps) {
  const baseClasses = "rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 strawberry:bg-linear-to-r strawberry:from-rose-500 strawberry:to-pink-500 strawberry:hover:from-rose-600 strawberry:hover:to-pink-600 cherry:bg-linear-to-r cherry:from-rose-700 cherry:to-pink-700 cherry:hover:from-rose-600 cherry:hover:to-pink-600 seafoam:bg-linear-to-r seafoam:from-cyan-500 seafoam:to-blue-500 seafoam:hover:from-cyan-600 seafoam:hover:to-blue-600 ocean:bg-linear-to-r ocean:from-cyan-700 ocean:to-blue-700 ocean:hover:from-cyan-600 ocean:hover:to-blue-600",
    secondary: "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 strawberry:border-rose-300 strawberry:bg-white strawberry:text-rose-700 strawberry:hover:bg-rose-50 cherry:border-rose-800 cherry:bg-rose-950 cherry:text-rose-300 cherry:hover:bg-rose-900 seafoam:border-cyan-300 seafoam:bg-white seafoam:text-cyan-700 seafoam:hover:bg-cyan-50 ocean:border-cyan-800 ocean:bg-cyan-950 ocean:text-cyan-300 ocean:hover:bg-cyan-900",
    icon: "p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 strawberry:hover:bg-rose-100 cherry:hover:bg-rose-900 seafoam:hover:bg-cyan-100 ocean:hover:bg-cyan-900",
  };

  const sizeClasses = {
    sm: variant === "icon" ? "p-1.5" : "px-3 py-1.5 text-xs",
    md: variant === "icon" ? "p-2" : "px-4 py-2 text-sm",
    lg: variant === "icon" ? "p-3" : "px-6 py-3 text-base",
  };

  const disabledClasses = disabled
    ? "opacity-50 cursor-not-allowed"
    : "";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        disabledClasses,
        className
      )}
    >
      {children}
    </button>
  );
}
