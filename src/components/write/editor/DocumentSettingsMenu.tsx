'use client';

import { useEffect, useRef, useState } from 'react';
import { LuFileText, LuQuote, LuFileType, LuRotateCcw } from 'react-icons/lu';
import { cn } from '@/lib/class-utils';

interface DocumentSettingsMenuProps {
  smartQuotes: boolean;
  onToggleSmartQuotes: () => void;
  onApplyManuscriptFormat: () => void;
  onRestoreDefaultFormat: () => void;
  manuscriptFormatDisabled?: boolean;
  manuscriptFormatBusy?: boolean;
}

// Popover menu launched from the toolbar's document icon. Owns UI state
// (open/closed) only; the actual actions are driven by parent props. Manuscript
// format is a one-time apply/restore action (not a toggle) because it rewrites
// the underlying Google Doc and can't be undone from DailyWrite.
export function DocumentSettingsMenu({
  smartQuotes,
  onToggleSmartQuotes,
  onApplyManuscriptFormat,
  onRestoreDefaultFormat,
  manuscriptFormatDisabled = false,
  manuscriptFormatBusy = false,
}: DocumentSettingsMenuProps) {
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
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const formatActionsDisabled = manuscriptFormatDisabled || manuscriptFormatBusy;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        aria-controls="document-settings-panel"
        aria-label="Document settings"
        title="Document settings"
        className={cn(
          'inline-flex h-8 w-8 items-center justify-center rounded-md text-base transition-colors',
          'text-fg-muted hover:bg-surface-muted hover:text-fg'
        )}
      >
        <LuFileText aria-hidden />
      </button>

      {isOpen && (
        <div
          id="document-settings-panel"
          role="menu"
          className="absolute left-0 top-full z-20 mt-2 w-64 rounded-md border border-line bg-surface p-1 shadow-lg"
        >
          <button
            type="button"
            role="menuitemcheckbox"
            aria-checked={smartQuotes}
            onClick={onToggleSmartQuotes}
            className="flex w-full cursor-pointer items-center justify-between rounded px-2 py-1.5 text-sm text-fg-subtle hover:bg-surface-muted hover:text-fg"
          >
            <span className="flex items-center gap-2">
              <LuQuote className="h-4 w-4" aria-hidden />
              Smart quotes
            </span>
            <span
              className={cn(
                'text-xs',
                smartQuotes ? 'text-accent-subtle-fg' : 'text-fg-faint'
              )}
            >
              {smartQuotes ? 'On' : 'Off'}
            </span>
          </button>

          <button
            type="button"
            role="menuitem"
            aria-disabled={formatActionsDisabled}
            disabled={formatActionsDisabled}
            onClick={() => {
              setIsOpen(false);
              onApplyManuscriptFormat();
            }}
            className={cn(
              'flex w-full items-center justify-between rounded px-2 py-1.5 text-sm text-fg-subtle',
              formatActionsDisabled
                ? 'cursor-not-allowed opacity-50'
                : 'cursor-pointer hover:bg-surface-muted hover:text-fg'
            )}
            title="Reformats the Google Doc to Standard Manuscript Format (page size, margins, font, spacing, indent, alignment). Changes the Google Doc and can't be undone from DailyWrite."
          >
            <span className="flex items-center gap-2">
              <LuFileType className="h-4 w-4" aria-hidden />
              Apply SMF
            </span>
            {manuscriptFormatBusy && <span className="text-xs text-fg-faint">…</span>}
          </button>

          <button
            type="button"
            role="menuitem"
            aria-disabled={formatActionsDisabled}
            disabled={formatActionsDisabled}
            onClick={() => {
              setIsOpen(false);
              onRestoreDefaultFormat();
            }}
            className={cn(
              'flex w-full items-center justify-between rounded px-2 py-1.5 text-sm text-fg-subtle',
              formatActionsDisabled
                ? 'cursor-not-allowed opacity-50'
                : 'cursor-pointer hover:bg-surface-muted hover:text-fg'
            )}
            title="Resets the Google Doc to Google Docs' default layout (Arial 11pt, single spaced, 1-inch margins, no indent). Changes the Google Doc and can't be undone from DailyWrite."
          >
            <span className="flex items-center gap-2">
              <LuRotateCcw className="h-4 w-4" aria-hidden />
              Apply Google Docs Defaults
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

export default DocumentSettingsMenu;
