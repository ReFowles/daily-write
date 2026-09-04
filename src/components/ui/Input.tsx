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
  // Border lives on the wrapper so the Energy/Ambition rainbow-border rule
  // (which uses `::before`/`::after`) can attach — `<input>` can't render
  // pseudo-elements.
  const wrapperClasses = cn(
    "relative w-full rounded-md border border-line bg-surface",
    "focus-within:border-accent-ring focus-within:ring-1 focus-within:ring-accent-ring",
    disabled && "cursor-not-allowed opacity-50",
    className
  );

  const inputPadding = leadingIcon ? "pl-9 pr-3 py-2" : "px-3 py-2";
  const inputClasses = cn(
    "block w-full bg-transparent text-sm text-fg outline-none",
    "placeholder:text-fg-faint",
    inputPadding,
    disabled && "cursor-not-allowed"
  );

  return (
    <div className={wrapperClasses}>
      {leadingIcon && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-fg-faint"
        >
          {leadingIcon}
        </span>
      )}
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
        className={inputClasses}
      />
    </div>
  );
}
