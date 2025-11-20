interface ChevronRightProps {
  className?: string;
}

export function ChevronRight({ className = "h-5 w-5" }: ChevronRightProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
  );
}
