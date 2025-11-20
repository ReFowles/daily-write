interface ChevronLeftProps {
  className?: string;
}

export function ChevronLeft({ className = "h-5 w-5" }: ChevronLeftProps) {
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
      <polyline points="15 18 9 12 15 6"></polyline>
    </svg>
  );
}
