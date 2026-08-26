interface ParagraphIndentProps {
  className?: string;
}

export function ParagraphIndent({ className = "h-4 w-4" }: ParagraphIndentProps) {
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
        d="M9 5h12M3 10h18M3 15h18M3 20h12"
      />
    </svg>
  );
}
