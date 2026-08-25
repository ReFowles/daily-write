'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import type { DocumentTab } from '@/lib/types';

interface DocumentTabsProps {
  documentId: string;
  selectedTabId?: string;
  onSelectTab: (tab: DocumentTab) => void;
  onTabsChange?: (tabs: DocumentTab[]) => void;
}

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
  
  // Use refs to avoid re-fetching when callbacks change
  const onSelectTabRef = useRef(onSelectTab);
  const onTabsChangeRef = useRef(onTabsChange);
  
  // Keep refs up to date
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
      
      // If we have tabs, select the first one
      if (data.tabs.length > 0) {
        onSelectTabRef.current(data.tabs[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [documentId]); // Only depend on documentId

  // Fetch tabs only when documentId changes
  useEffect(() => {
    setHasFetched(false);
    fetchTabs();
  }, [fetchTabs]);

  // Don't render anything if there's only one tab (the default)
  if (!loading && !error && tabs.length <= 1) {
    return null;
  }

  if (loading && !hasFetched) {
    return (
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 strawberry:border-pink-200 cherry:border-rose-800 seafoam:border-cyan-200 ocean:border-cyan-800 px-2 py-1.5">
        <span className="text-xs text-gray-500 dark:text-gray-400 strawberry:text-rose-600 cherry:text-rose-400 seafoam:text-cyan-600 ocean:text-cyan-400">
          Loading tabs...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 strawberry:border-pink-200 cherry:border-rose-800 seafoam:border-cyan-200 ocean:border-cyan-800 px-2 py-1.5">
        <span className="text-xs text-red-600 dark:text-red-400 strawberry:text-rose-700 cherry:text-rose-400 seafoam:text-red-600 ocean:text-red-400">
          {error}
        </span>
        <button
          onClick={() => fetchTabs()}
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline strawberry:text-rose-600 cherry:text-rose-400 seafoam:text-cyan-600 ocean:text-cyan-400"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 border-b border-gray-200 dark:border-gray-700 strawberry:border-pink-200 cherry:border-rose-800 seafoam:border-cyan-200 ocean:border-cyan-800 px-2 overflow-x-auto">
      {/* Tab List */}
      {tabs.map((tab) => {
        const isSelected = tab.tabId === selectedTabId;

        return (
          <button
            key={tab.tabId}
            onClick={() => onSelectTab(tab)}
            className={`px-3 py-2 -mb-px border-b-2 transition-colors text-xs font-medium whitespace-nowrap ${
              isSelected
                ? 'border-blue-500 dark:border-blue-400 strawberry:border-rose-500 cherry:border-rose-400 seafoam:border-cyan-500 ocean:border-cyan-400 text-blue-600 dark:text-blue-400 strawberry:text-rose-600 cherry:text-rose-400 seafoam:text-cyan-600 ocean:text-cyan-400'
                : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600 strawberry:hover:border-pink-300 cherry:hover:border-rose-700 seafoam:hover:border-cyan-300 ocean:hover:border-cyan-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white strawberry:text-rose-600 strawberry:hover:text-rose-900 cherry:text-rose-400 cherry:hover:text-rose-100 seafoam:text-cyan-600 seafoam:hover:text-cyan-900 ocean:text-cyan-400 ocean:hover:text-cyan-100'
            }`}
          >
            {tab.title}
          </button>
        );
      })}
      
      {/* Info tooltip about tab management */}
      <span 
        className="ml-auto px-2 py-1.5 text-xs text-gray-400 dark:text-gray-500 strawberry:text-rose-400 cherry:text-rose-600 seafoam:text-cyan-400 ocean:text-cyan-600 cursor-help"
        title="To add, remove, or rename tabs, edit the document directly in Google Docs"
      >
        ⓘ
      </span>
    </div>
  );
}
