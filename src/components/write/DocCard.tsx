"use client";

import { LuStar } from "react-icons/lu";
import { formatDistanceToNow } from "@/lib/date-utils";
import { themeClasses } from "@/lib/theme-utils";
import { cn } from "@/lib/class-utils";
import type { GoogleDoc } from "@/lib/types";

interface DocCardProps {
  doc: GoogleDoc;
  isSelected: boolean;
  isFavorite: boolean;
  onSelect: (doc: GoogleDoc) => void;
  onToggleFavorite: (doc: GoogleDoc) => void;
}

export default function DocCard({
  doc,
  isSelected,
  isFavorite,
  onSelect,
  onToggleFavorite,
}: DocCardProps) {
  const modifiedDate = new Date(doc.modifiedTime);

  return (
    <div
      className={cn(
        "relative rounded-lg border transition-all",
        isSelected
          ? "border-accent bg-accent-subtle"
          : cn(
              themeClasses.border.card,
              "hover:border-line-strong"
            )
      )}
    >
      <button
        type="button"
        onClick={() => onSelect(doc)}
        className="w-full pr-9 text-left p-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        aria-label={`Open ${doc.name}`}
      >
        <h3 className={cn("text-sm font-medium truncate", themeClasses.text.primary)}>
          {doc.name}
        </h3>
        {doc.path && (
          <p className={cn("text-xs mt-1 truncate", themeClasses.text.secondary)} title={doc.path}>
            {doc.path}
          </p>
        )}
        <p className={cn("text-xs mt-1", themeClasses.text.secondary)}>
          {formatDistanceToNow(modifiedDate)}
        </p>
      </button>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onToggleFavorite(doc);
        }}
        aria-pressed={isFavorite}
        aria-label={isFavorite ? `Unfavorite ${doc.name}` : `Favorite ${doc.name}`}
        title={isFavorite ? "Remove from favorites" : "Add to favorites"}
        className={cn(
          "absolute top-2 right-2 rounded p-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
          isFavorite
            ? "text-amber-500 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300"
            : "text-fg-subtle hover:text-fg-muted"
        )}
      >
        <LuStar className="h-4 w-4" fill={isFavorite ? "currentColor" : "none"} />
      </button>
    </div>
  );
}
