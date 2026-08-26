interface LineSpacingProps {
  className?: string;
}

export function LineSpacing({ className = "h-4 w-4" }: LineSpacingProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 3v18M4 3l-2 3M4 3l2 3M4 21l-2-3M4 21l2-3"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 6h12M9 12h12M9 18h12"
      />
    </svg>
  );
}
