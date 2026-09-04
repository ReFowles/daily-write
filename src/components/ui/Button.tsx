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
  const baseClasses =
    "rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-accent-ring focus:ring-offset-2";

  const variantClasses = {
    primary: "accent-fill",
    secondary:
      "border border-line bg-surface text-fg hover:bg-surface-muted",
    icon: "text-fg-muted hover:bg-surface-muted hover:text-fg",
  };

  const sizeClasses = {
    sm: variant === "icon" ? "p-1.5" : "px-3 py-1.5 text-xs",
    md: variant === "icon" ? "p-2" : "px-4 py-2 text-sm",
    lg: variant === "icon" ? "p-3" : "px-6 py-3 text-base",
  };

  const disabledClasses = disabled ? "opacity-50 cursor-not-allowed" : "";

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
