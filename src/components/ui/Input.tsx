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
    "w-full rounded-md border border-zinc-300 bg-white text-sm text-zinc-900 placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-400 strawberry:border-rose-300 strawberry:placeholder-rose-400 strawberry:focus:border-rose-500 strawberry:focus:ring-rose-500 cherry:border-rose-800 cherry:bg-rose-950 cherry:text-rose-100 cherry:placeholder-rose-500 cherry:focus:border-rose-600 cherry:focus:ring-rose-600 seafoam:border-cyan-300 seafoam:placeholder-cyan-500 seafoam:focus:border-cyan-500 seafoam:focus:ring-cyan-500 ocean:border-cyan-800 ocean:bg-cyan-950 ocean:text-cyan-100 ocean:placeholder-cyan-600 ocean:focus:border-cyan-600 ocean:focus:ring-cyan-600",
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
        className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400 dark:text-zinc-500 strawberry:text-rose-400 cherry:text-rose-500 seafoam:text-cyan-500 ocean:text-cyan-500"
      >
        {leadingIcon}
      </span>
      {inputEl}
    </div>
  );
}
