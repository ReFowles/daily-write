'use client';

import { useEffect, useLayoutEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { LuInfo } from 'react-icons/lu';
import type { DocumentTab } from '@/lib/types';
import { themeClasses } from '@/lib/theme-utils';
import { cn } from '@/lib/class-utils';

interface DocumentTabsProps {
  documentId: string;
  selectedTabId?: string;
  onSelectTab: (tab: DocumentTab) => void;
  onTabsChange?: (tabs: DocumentTab[]) => void;
}

const containerClasses = cn(
  'flex items-center gap-2 border-b px-2 py-1.5',
  themeClasses.border.divider
);

const errorTextClasses =
  'text-xs text-red-600 dark:text-red-400';

/**
 * DocumentTabs component - Displays tabs for a Google Doc
 *
 * NOTE: The Google Docs API does NOT support creating, deleting, or renaming tabs programmatically.
 * This component is read-only - users can switch between existing tabs but cannot modify them.
 * To add/remove/rename tabs, users must do so directly in Google Docs.
 */
export default function DocumentTabs({
  documentId,
  selectedTabId,
  onSelectTab,
  onTabsChange,
}: DocumentTabsProps) {
  const [tabs, setTabs] = useState<DocumentTab[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  // Refs avoid re-fetching when callbacks change identity.
  const onSelectTabRef = useRef(onSelectTab);
  const onTabsChangeRef = useRef(onTabsChange);
  const selectedTabIdRef = useRef(selectedTabId);

  useEffect(() => {
    onSelectTabRef.current = onSelectTab;
    onTabsChangeRef.current = onTabsChange;
    selectedTabIdRef.current = selectedTabId;
  }, [onSelectTab, onTabsChange, selectedTabId]);

  const fetchTabs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/google-docs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'getTabs', documentId }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch tabs');
      }

      const data = await response.json();
      setTabs(data.tabs);
      setHasFetched(true);
      onTabsChangeRef.current?.(data.tabs);

      if (data.tabs.length > 0) {
        // Honor a caller-provided tab id (e.g. restored from the URL) on the
        // initial fetch; otherwise fall back to the first tab.
        const desired = selectedTabIdRef.current;
        const target = desired
          ? (data.tabs as DocumentTab[]).find((t) => t.tabId === desired)
          : undefined;
        onSelectTabRef.current(target ?? data.tabs[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    setHasFetched(false);
    fetchTabs();
  }, [fetchTabs]);

  // Don't render anything if there's only one tab (the default).
  if (!loading && !error && tabs.length <= 1) {
    return null;
  }

  if (loading && !hasFetched) {
    return (
      <div className={containerClasses}>
        <span className={cn('text-xs', themeClasses.text.secondary)}>Loading tabs...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={containerClasses}>
        <span className={errorTextClasses}>{error}</span>
        <button
          onClick={() => fetchTabs()}
          className={cn('text-xs hover:underline', themeClasses.text.link)}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center gap-1 border-b px-2 overflow-x-auto',
        themeClasses.border.divider
      )}
    >
      {tabs.map((tab) => {
        const isSelected = tab.tabId === selectedTabId;

        return (
          <button
            key={tab.tabId}
            onClick={() => onSelectTab(tab)}
            className={cn(
              'px-3 py-2 -mb-px border-b-2 transition-colors text-xs font-medium whitespace-nowrap',
              isSelected
                ? 'border-accent text-accent'
                : cn(
                    'border-transparent hover:border-line-strong hover:text-fg',
                    themeClasses.text.secondary
                  )
            )}
          >
            {tab.title}
          </button>
        );
      })}

      <span className="ml-auto">
        <TabsInfoPopover />
      </span>
    </div>
  );
}

const POPOVER_WIDTH = 288; // px
const POPOVER_MARGIN = 12;

// Portal + fixed-position popover matches the pattern used by
// CreateGoalForm's InfoPopover / UnverifiedAppNotice / DocCard so it can't
// be clipped by the tabs bar's horizontal overflow scroll.
function TabsInfoPopover() {
  const label = 'About document tabs';
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number; width: number } | null>(
    null
  );
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!isOpen || !buttonRef.current) return;

    const reposition = () => {
      const rect = buttonRef.current!.getBoundingClientRect();
      const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : POPOVER_WIDTH;
      const width = Math.min(POPOVER_WIDTH, viewportWidth - POPOVER_MARGIN * 2);
      const left = Math.min(
        Math.max(rect.right - width, POPOVER_MARGIN),
        Math.max(POPOVER_MARGIN, viewportWidth - width - POPOVER_MARGIN)
      );
      setPosition({ top: rect.bottom + 8, left, width });
    };

    reposition();
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    return () => {
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target)) return;
      if (popoverRef.current?.contains(target)) return;
      setIsOpen(false);
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('pointerdown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('pointerdown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [isOpen]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={label}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className={cn(
          'px-2 py-1.5 rounded transition-colors',
          themeClasses.text.tertiary,
          'hover:text-fg'
        )}
      >
        <LuInfo className="h-4 w-4" aria-hidden />
      </button>
      {isOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={popoverRef}
            role="dialog"
            aria-label={label}
            style={
              position
                ? { position: 'fixed', top: position.top, left: position.left, width: position.width }
                : { position: 'fixed', visibility: 'hidden' }
            }
            className={cn(
              'z-50 rounded-md border p-3 text-sm shadow-lg',
              themeClasses.border.default,
              themeClasses.background.overlay,
              themeClasses.text.secondary
            )}
          >
            To add, remove, or rename tabs, edit the document directly in Google Docs
          </div>,
          document.body
        )}
    </>
  );
}
