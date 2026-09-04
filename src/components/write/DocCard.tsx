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
          ? "border-blue-500 bg-blue-50 dark:bg-blue-950 strawberry:border-rose-500 strawberry:bg-rose-100 cherry:border-rose-500 cherry:bg-rose-950 seafoam:border-cyan-500 seafoam:bg-cyan-100 ocean:border-cyan-500 ocean:bg-cyan-950"
          : cn(
              themeClasses.border.card,
              "hover:border-zinc-300 dark:hover:border-zinc-600 strawberry:hover:border-pink-300 cherry:hover:border-rose-800 seafoam:hover:border-cyan-300 ocean:hover:border-cyan-800"
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
            : "text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 strawberry:text-rose-400 strawberry:hover:text-rose-600 cherry:text-rose-600 cherry:hover:text-rose-400 seafoam:text-cyan-400 seafoam:hover:text-cyan-600 ocean:text-cyan-600 ocean:hover:text-cyan-400"
        )}
      >
        <LuStar className="h-4 w-4" fill={isFavorite ? "currentColor" : "none"} />
      </button>
    </div>
  );
}
