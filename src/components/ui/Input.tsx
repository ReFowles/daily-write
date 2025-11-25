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
}: InputProps) {
  const baseClasses =
    "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-400 strawberry:border-rose-300 strawberry:focus:border-rose-500 strawberry:focus:ring-rose-500 cherry:border-rose-800 cherry:bg-rose-950 cherry:text-rose-100 cherry:focus:border-rose-600 cherry:focus:ring-rose-600 seafoam:border-cyan-300 seafoam:focus:border-cyan-500 seafoam:focus:ring-cyan-500 ocean:border-cyan-800 ocean:bg-cyan-950 ocean:text-cyan-100 ocean:focus:border-cyan-600 ocean:focus:ring-cyan-600";

  const disabledClasses = disabled ? "opacity-50 cursor-not-allowed" : "";

  return (
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
}
