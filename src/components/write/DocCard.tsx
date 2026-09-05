"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { LuInfo, LuStar } from "react-icons/lu";
import { formatDistanceToNow } from "@/lib/date-utils";
import { formatWordCount } from "@/lib/format-utils";
import { themeClasses } from "@/lib/theme-utils";
import { cn } from "@/lib/class-utils";
import { useDocWordCount } from "@/lib/use-doc-word-count";
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
  const { wordCount, elementRef: wordCountRef } = useDocWordCount(doc.id);

  const titleRef = useRef<HTMLHeadingElement>(null);
  const pathRef = useRef<HTMLParagraphElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const [isClipped, setIsClipped] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);

  // Detect horizontal truncation on the title and/or breadcrumb so we only
  // surface the info affordance when the user actually can't read them.
  useLayoutEffect(() => {
    const measure = () => {
      const t = titleRef.current;
      const p = pathRef.current;
      const clipped =
        (!!t && t.scrollWidth > t.clientWidth) ||
        (!!p && p.scrollWidth > p.clientWidth);
      setIsClipped(clipped);
    };
    measure();

    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    if (titleRef.current) ro.observe(titleRef.current);
    if (pathRef.current) ro.observe(pathRef.current);
    return () => ro.disconnect();
  }, [doc.name, doc.path]);

  useEffect(() => {
    if (!popoverOpen) return;

    const handlePointer = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (popoverRef.current?.contains(target)) return;
      if (triggerRef.current?.contains(target)) return;
      setPopoverOpen(false);
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPopoverOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [popoverOpen]);

  return (
    <div
      ref={wordCountRef}
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
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelect(doc)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onSelect(doc);
          }
        }}
        className="w-full text-left p-3 rounded-lg cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        aria-label={`Open ${doc.name}`}
      >
        <h3
          ref={titleRef}
          className={cn("text-sm font-medium truncate pr-7", themeClasses.text.primary)}
        >
          {doc.name}
        </h3>
        {doc.path && (
          <p
            ref={pathRef}
            className={cn("text-xs mt-1 truncate", themeClasses.text.secondary)}
          >
            {doc.path}
          </p>
        )}
        {wordCount !== null && (
          <p className={cn("text-xs mt-1", themeClasses.text.secondary)}>
            {formatWordCount(wordCount)} words
          </p>
        )}
        <p
          className={cn(
            "text-xs mt-1",
            themeClasses.text.secondary,
            isClipped && "pr-7"
          )}
        >
          {formatDistanceToNow(modifiedDate)}
        </p>
      </div>
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
      {isClipped && (
        <div className="absolute bottom-2 right-2">
          <button
            ref={triggerRef}
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setPopoverOpen((open) => !open);
            }}
            aria-expanded={popoverOpen}
            aria-haspopup="dialog"
            aria-label={`Show full details for ${doc.name}`}
            title="Show full title and path"
            className="rounded p-1 cursor-pointer text-fg-subtle hover:text-fg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <LuInfo className="h-4 w-4" />
          </button>
          {popoverOpen && (
            <div
              ref={popoverRef}
              role="dialog"
              aria-label={`Full details for ${doc.name}`}
              className={cn(
                "absolute z-10 right-0 bottom-full mb-2 w-64 max-w-[calc(100vw-2rem)] rounded-md border p-3 shadow-lg",
                themeClasses.background.card,
                themeClasses.border.card
              )}
              onClick={(event) => event.stopPropagation()}
            >
              <p className={cn("text-sm font-medium break-words", themeClasses.text.primary)}>
                {doc.name}
              </p>
              {doc.path && (
                <p className={cn("text-xs mt-1 break-words", themeClasses.text.secondary)}>
                  {doc.path}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
