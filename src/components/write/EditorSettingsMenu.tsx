"use client";

import { useEffect, useRef, useState } from "react";
import { LuALargeSmall, LuBaseline, LuEye, LuEyeOff, LuIndentIncrease, LuSettings } from "react-icons/lu";
import { cn } from "@/lib/class-utils";
import type { FontSize, LineSpacing } from "@/components/write/editor";

const LINE_SPACING_LABEL: Record<LineSpacing, string> = {
  normal: "Normal",
  relaxed: "Relaxed",
  spacious: "Spacious",
};

const FONT_SIZE_LABEL: Record<FontSize, string> = {
  small: "Small",
  medium: "Medium",
  large: "Large",
  xlarge: "XL",
};

interface EditorSettingsMenuProps {
  focusMode: boolean;
  onToggleFocusMode: () => void;
  lineSpacing: LineSpacing;
  onCycleLineSpacing: () => void;
  fontSize: FontSize;
  onCycleFontSize: () => void;
  paragraphIndent: boolean;
  onToggleParagraphIndent: () => void;
}

export function EditorSettingsMenu({
  focusMode,
  onToggleFocusMode,
  lineSpacing,
  onCycleLineSpacing,
  fontSize,
  onCycleFontSize,
  paragraphIndent,
  onToggleParagraphIndent,
}: EditorSettingsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        aria-controls="editor-settings-panel"
        aria-label="Editor settings"
        title="Editor settings"
        className="cursor-pointer rounded p-1 text-fg-subtle transition-colors hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring"
      >
        <LuSettings className="h-4 w-4" />
      </button>

      {isOpen && (
        <div
          id="editor-settings-panel"
          role="menu"
          className="absolute bottom-full left-0 z-20 mb-2 w-56 rounded-md border border-line bg-surface p-1 shadow-lg"
        >
          <button
            type="button"
            role="menuitemcheckbox"
            aria-checked={focusMode}
            onClick={onToggleFocusMode}
            className="flex w-full cursor-pointer items-center justify-between rounded px-2 py-1.5 text-sm text-fg-subtle hover:bg-surface-muted hover:text-fg"
          >
            <span className="flex items-center gap-2">
              {focusMode ? <LuEyeOff className="h-4 w-4" /> : <LuEye className="h-4 w-4" />}
              Focus mode
            </span>
            <span className="text-xs text-fg-faint">{focusMode ? "On" : "Off"}</span>
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={onCycleLineSpacing}
            className="flex w-full cursor-pointer items-center justify-between rounded px-2 py-1.5 text-sm text-fg-subtle hover:bg-surface-muted hover:text-fg"
          >
            <span className="flex items-center gap-2">
              <LuBaseline className="h-4 w-4" />
              Line spacing
            </span>
            <span className="text-xs text-fg-faint">{LINE_SPACING_LABEL[lineSpacing]}</span>
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={onCycleFontSize}
            className="flex w-full cursor-pointer items-center justify-between rounded px-2 py-1.5 text-sm text-fg-subtle hover:bg-surface-muted hover:text-fg"
          >
            <span className="flex items-center gap-2">
              <LuALargeSmall className="h-4 w-4" />
              Font size
            </span>
            <span className="text-xs text-fg-faint">{FONT_SIZE_LABEL[fontSize]}</span>
          </button>

          <button
            type="button"
            role="menuitemcheckbox"
            aria-checked={paragraphIndent}
            onClick={onToggleParagraphIndent}
            className="flex w-full cursor-pointer items-center justify-between rounded px-2 py-1.5 text-sm text-fg-subtle hover:bg-surface-muted hover:text-fg"
          >
            <span className="flex items-center gap-2">
              <LuIndentIncrease className="h-4 w-4" />
              Paragraph indent
            </span>
            <span
              className={cn(
                "text-xs",
                paragraphIndent ? "text-accent-subtle-fg" : "text-fg-faint"
              )}
            >
              {paragraphIndent ? "On" : "Off"}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

export default EditorSettingsMenu;
