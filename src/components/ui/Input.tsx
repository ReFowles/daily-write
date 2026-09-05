import type { ReactNode } from "react";
import { LuChevronDown, LuChevronUp } from "react-icons/lu";
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
  step?: string | number;
  className?: string;
  autoFocus?: boolean;
  "aria-label"?: string;
  leadingIcon?: ReactNode;
  // Render digit-only values with thousands separators. `value` stays a raw
  // digit string; only the visible field text is formatted.
  formatWithCommas?: boolean;
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
  step,
  className = "",
  autoFocus = false,
  "aria-label": ariaLabel,
  leadingIcon,
  formatWithCommas = false,
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

  const isNumeric = type === "number" || formatWithCommas;
  const renderedType = formatWithCommas ? "text" : type;
  const stepValue = step !== undefined ? Number(step) : 1;
  const minValue = min !== undefined ? Number(min) : Number.NEGATIVE_INFINITY;
  const maxValue = max !== undefined ? Number(max) : Number.POSITIVE_INFINITY;

  const emit = (rawDigits: string) => {
    onChange({
      target: { value: rawDigits },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  const nudge = (direction: 1 | -1) => {
    const current = Number(value);
    const base = Number.isFinite(current) ? current : 0;
    const next = Math.max(minValue, Math.min(maxValue, base + direction * stepValue));
    emit(String(next));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (formatWithCommas) {
      emit(e.target.value.replace(/[^0-9]/g, ""));
      return;
    }
    onChange(e);
  };

  const displayValue = formatWithCommas && value !== ""
    ? Number(value).toLocaleString("en-US")
    : value;

  const leftPad = leadingIcon ? "pl-9" : "pl-3";
  const rightPad = isNumeric ? "pr-8" : "pr-3";
  const inputClasses = cn(
    "block w-full bg-transparent py-2 text-sm text-fg outline-none",
    "placeholder:text-fg-faint",
    leftPad,
    rightPad,
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
        type={renderedType}
        inputMode={formatWithCommas ? "numeric" : undefined}
        pattern={formatWithCommas ? "[0-9,]*" : undefined}
        id={id}
        name={name}
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        min={formatWithCommas ? undefined : min}
        max={formatWithCommas ? undefined : max}
        step={formatWithCommas ? undefined : step}
        autoFocus={autoFocus}
        aria-label={ariaLabel}
        className={inputClasses}
      />
      {isNumeric && !disabled && (
        <div
          aria-hidden
          className="absolute inset-y-0 right-1 flex flex-col justify-center gap-0.5"
        >
          <button
            type="button"
            tabIndex={-1}
            onClick={() => nudge(1)}
            className="flex h-3.5 w-5 items-center justify-center rounded text-fg-subtle transition-colors hover:bg-surface-muted hover:text-fg"
          >
            <LuChevronUp className="h-3 w-3" />
          </button>
          <button
            type="button"
            tabIndex={-1}
            onClick={() => nudge(-1)}
            className="flex h-3.5 w-5 items-center justify-center rounded text-fg-subtle transition-colors hover:bg-surface-muted hover:text-fg"
          >
            <LuChevronDown className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}
