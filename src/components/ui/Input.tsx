import type { ReactNode } from "react";
import { cn } from "@/lib/class-utils";

interface InputProps {
  type?: "text" | "date" | "number" | "email" | "password";
  id?: string;
  name?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  min?: string | number;
  max?: string | number;
  className?: string;
  autoFocus?: boolean;
  "aria-label"?: string;
  leadingIcon?: ReactNode;
}

export function Input({
  type = "text",
  id,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  min,
  max,
  className = "",
  autoFocus = false,
  "aria-label": ariaLabel,
  leadingIcon,
}: InputProps) {
  const paddingClasses = leadingIcon ? "pl-9 pr-3 py-2" : "px-3 py-2";
  const baseClasses = cn(
    "w-full rounded-md border border-line bg-surface text-sm text-fg",
    "placeholder:text-fg-faint",
    "focus:border-accent-ring focus:outline-none focus:ring-1 focus:ring-accent-ring",
    paddingClasses
  );

  const disabledClasses = disabled ? "opacity-50 cursor-not-allowed" : "";

  const inputEl = (
    <input
      type={type}
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      min={min}
      max={max}
      autoFocus={autoFocus}
      aria-label={ariaLabel}
      className={cn(baseClasses, disabledClasses, className)}
    />
  );

  if (!leadingIcon) return inputEl;

  return (
    <div className="relative">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-fg-faint"
      >
        {leadingIcon}
      </span>
      {inputEl}
    </div>
  );
}
