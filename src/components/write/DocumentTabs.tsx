'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
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
  'text-xs text-red-600 dark:text-red-400 strawberry:text-red-700 cherry:text-red-300 seafoam:text-red-600 ocean:text-red-300';

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

  useEffect(() => {
    onSelectTabRef.current = onSelectTab;
    onTabsChangeRef.current = onTabsChange;
  }, [onSelectTab, onTabsChange]);

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
        onSelectTabRef.current(data.tabs[0]);
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
                ? 'border-blue-500 dark:border-blue-400 strawberry:border-rose-500 cherry:border-rose-400 seafoam:border-cyan-500 ocean:border-cyan-400 text-blue-600 dark:text-blue-400 strawberry:text-rose-600 cherry:text-rose-400 seafoam:text-cyan-600 ocean:text-cyan-400'
                : cn(
                    'border-transparent hover:border-zinc-300 dark:hover:border-zinc-600 strawberry:hover:border-pink-300 cherry:hover:border-rose-700 seafoam:hover:border-cyan-300 ocean:hover:border-cyan-700 hover:text-zinc-900 dark:hover:text-zinc-50 strawberry:hover:text-rose-900 cherry:hover:text-rose-100 seafoam:hover:text-cyan-900 ocean:hover:text-cyan-100',
                    themeClasses.text.secondary
                  )
            )}
          >
            {tab.title}
          </button>
        );
      })}

      <span
        className={cn('ml-auto px-2 py-1.5 text-xs cursor-help', themeClasses.text.tertiary)}
        title="To add, remove, or rename tabs, edit the document directly in Google Docs"
      >
        ⓘ
      </span>
    </div>
  );
}
