'use client';

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
  type CSSProperties,
} from 'react';
import { createPortal } from 'react-dom';
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  LuPlus,
  LuPencil,
  LuTrash2,
  LuEllipsisVertical,
  LuGripVertical,
  LuLock,
  LuLockOpen,
  LuChevronDown,
  LuChevronRight,
} from 'react-icons/lu';
import type { DocumentTab } from '@/lib/types';
import { themeClasses } from '@/lib/theme-utils';
import { cn } from '@/lib/class-utils';

interface DocumentTabsProps {
  documentId: string;
  selectedTabId?: string;
  onSelectTab: (tab: DocumentTab) => void;
  onTabsChange?: (tabs: DocumentTab[]) => void;
  // Flush pending editor edits before a tab mutation; return false to abort.
  onBeforeMutate?: () => Promise<boolean> | boolean;
  // Adopt the document's post-mutation revisionId as the new save baseline.
  onTabsPersisted?: (revisionId?: string) => void;
}

const containerClasses = cn(
  'flex items-end gap-0 px-2 pt-1 overflow-x-auto',
  themeClasses.border.divider
);

const messageContainerClasses = cn(
  'flex items-center gap-2 px-2 py-1.5',
  themeClasses.border.divider
);

const errorTextClasses = 'text-xs text-red-600 dark:text-red-400';

const iconButtonClasses = cn(
  'rounded p-1 transition-colors disabled:opacity-40',
  themeClasses.text.tertiary,
  'hover:text-fg'
);

// Deeper tabs are shorter so, bottom-aligned in the bar, nesting reads as a
// descending stair-step. Depth beyond the last entry reuses the shortest.
const DEPTH_HEIGHTS = ['h-9', 'h-8', 'h-7', 'h-6'] as const;
const depthHeightClass = (level: number) =>
  DEPTH_HEIGHTS[Math.min(level, DEPTH_HEIGHTS.length - 1)];

const parentKeyOf = (tab: DocumentTab) => tab.parentTabId ?? '';

// Builds lookups for finding a tab by id and testing whether a tab has children.
function indexTabs(tabs: DocumentTab[]) {
  const byId = new Map<string, DocumentTab>();
  const parents = new Set<string>();
  for (const tab of tabs) {
    byId.set(tab.tabId, tab);
    if (tab.parentTabId) parents.add(tab.parentTabId);
  }
  return { byId, hasChildren: (id: string) => parents.has(id) };
}

// A tab plus its descendants occupy a contiguous span in the DFS-ordered array;
// this returns that span for the tab starting at `startIdx`.
function subtreeRange(tabs: DocumentTab[], startIdx: number): [number, number] {
  const baseLevel = tabs[startIdx].nestingLevel;
  let end = startIdx + 1;
  while (end < tabs.length && tabs[end].nestingLevel > baseLevel) end++;
  return [startIdx, end];
}

// Reorders sibling subtrees (each a parent tab plus its descendants) within the
// flat tab array to match `orderedSiblingIds`. Sibling subtrees are contiguous
// and consecutive in DFS order, so the whole group is a single replaceable span.
function reorderSiblingSubtrees(
  tabs: DocumentTab[],
  parentKey: string,
  orderedSiblingIds: string[]
): DocumentTab[] {
  const siblingStarts = tabs
    .map((tab, i) => (parentKeyOf(tab) === parentKey ? i : -1))
    .filter((i) => i >= 0);
  if (siblingStarts.length < 2) return tabs;

  const blocks = new Map<string, DocumentTab[]>();
  const spanStart = siblingStarts[0];
  let spanEnd = spanStart;
  for (const start of siblingStarts) {
    const [blockStart, blockEnd] = subtreeRange(tabs, start);
    blocks.set(tabs[start].tabId, tabs.slice(blockStart, blockEnd));
    spanEnd = blockEnd;
  }
  if (orderedSiblingIds.some((id) => !blocks.has(id))) return tabs;

  const middle = orderedSiblingIds.flatMap((id) => blocks.get(id) ?? []);
  return [...tabs.slice(0, spanStart), ...middle, ...tabs.slice(spanEnd)];
}

/**
 * DocumentTabs component - Displays and manages tabs for a Google Doc.
 *
 * Tabs (including nested sub-tabs) can be created, renamed, deleted, collapsed,
 * and reordered via the Google Docs API's tab batchUpdate requests. The bar is
 * shown for every document, even ones that currently have a single tab.
 */
export default function DocumentTabs({
  documentId,
  selectedTabId,
  onSelectTab,
  onTabsChange,
  onBeforeMutate,
  onTabsPersisted,
}: DocumentTabsProps) {
  const [tabs, setTabs] = useState<DocumentTab[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  // Parent tab ids whose sub-tabs are hidden.
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [reorderMode, setReorderMode] = useState(false);

  // Refs avoid re-fetching when callbacks change identity.
  const onSelectTabRef = useRef(onSelectTab);
  const onTabsChangeRef = useRef(onTabsChange);
  const onBeforeMutateRef = useRef(onBeforeMutate);
  const onTabsPersistedRef = useRef(onTabsPersisted);
  const selectedTabIdRef = useRef(selectedTabId);

  useEffect(() => {
    onSelectTabRef.current = onSelectTab;
    onTabsChangeRef.current = onTabsChange;
    onBeforeMutateRef.current = onBeforeMutate;
    onTabsPersistedRef.current = onTabsPersisted;
    selectedTabIdRef.current = selectedTabId;
  }, [onSelectTab, onTabsChange, onBeforeMutate, onTabsPersisted, selectedTabId]);

  const { byId, hasChildren } = useMemo(() => indexTabs(tabs), [tabs]);

  const visibleTabs = useMemo(() => {
    const isHidden = (tab: DocumentTab) => {
      let parent = tab.parentTabId;
      while (parent) {
        if (collapsed.has(parent)) return true;
        parent = byId.get(parent)?.parentTabId;
      }
      return false;
    };
    return tabs.filter((tab) => !isHidden(tab));
  }, [tabs, collapsed, byId]);

  const visibleIds = useMemo(() => visibleTabs.map((t) => t.tabId), [visibleTabs]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

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

  // Sends a tab mutation, then syncs the refreshed tab list to local state and
  // the parent. Returns the parsed response (with `created` for createTab).
  const runTabAction = useCallback(
    async (
      body: Record<string, unknown>
    ): Promise<{ tabs: DocumentTab[]; created?: DocumentTab | null; revisionId?: string } | null> => {
      setBusy(true);
      setError(null);
      try {
        // Flush pending editor edits first so the doc is saved before the tab
        // action mutates it server-side; abort if that flush failed.
        const proceed = onBeforeMutateRef.current ? await onBeforeMutateRef.current() : true;
        if (!proceed) return null;

        const response = await fetch('/api/google-docs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...body, documentId }),
        });
        if (!response.ok) {
          throw new Error('Failed to update tabs');
        }
        const data = await response.json();
        const nextTabs: DocumentTab[] = data.tabs ?? [];
        setTabs(nextTabs);
        onTabsChangeRef.current?.(nextTabs);
        onTabsPersistedRef.current?.(
          typeof data.revisionId === 'string' ? data.revisionId : undefined
        );
        return data;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        return null;
      } finally {
        setBusy(false);
      }
    },
    [documentId]
  );

  const handleAddTab = useCallback(
    async (parentTabId?: string) => {
      // A new sub-tab is unreachable if its parent is collapsed, so expand it.
      if (parentTabId) {
        setCollapsed((prev) => {
          if (!prev.has(parentTabId)) return prev;
          const next = new Set(prev);
          next.delete(parentTabId);
          return next;
        });
      }
      const data = await runTabAction({
        action: 'createTab',
        title: parentTabId ? 'New sub-tab' : 'New tab',
        parentTabId,
      });
      const created = data?.created;
      if (created) {
        onSelectTabRef.current(created);
        // Drop the user straight into renaming the freshly-created tab.
        setEditingTabId(created.tabId);
        setDraftTitle(created.title);
      }
    },
    [runTabAction]
  );

  const handleDeleteTab = useCallback(
    async (tab: DocumentTab) => {
      const data = await runTabAction({ action: 'deleteTab', tabId: tab.tabId });
      if (!data) return;
      if (tab.tabId === selectedTabIdRef.current && data.tabs.length > 0) {
        onSelectTabRef.current(data.tabs[0]);
      }
    },
    [runTabAction]
  );

  const beginRename = useCallback((tab: DocumentTab) => {
    setEditingTabId(tab.tabId);
    setDraftTitle(tab.title);
  }, []);

  const commitRename = useCallback(
    async (tab: DocumentTab) => {
      const title = draftTitle.trim();
      setEditingTabId(null);
      if (!title || title === tab.title) return;
      await runTabAction({ action: 'updateTab', tabId: tab.tabId, title });
    },
    [draftTitle, runTabAction]
  );

  const toggleCollapse = useCallback((tab: DocumentTab) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(tab.tabId)) next.delete(tab.tabId);
      else next.add(tab.tabId);
      return next;
    });
  }, []);

  // Reordering is limited to same-parent siblings; the Docs API's per-parent
  // index makes that a single updateTab call. Cross-parent drops are ignored.
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const activeTab = byId.get(String(active.id));
      const overTab = byId.get(String(over.id));
      if (!activeTab || !overTab) return;

      const parentKey = parentKeyOf(activeTab);
      if (parentKey !== parentKeyOf(overTab)) return;

      const siblings = visibleTabs.filter((t) => parentKeyOf(t) === parentKey);
      const from = siblings.findIndex((t) => t.tabId === activeTab.tabId);
      const to = siblings.findIndex((t) => t.tabId === overTab.tabId);
      if (from === -1 || to === -1) return;

      const orderedIds = arrayMove(siblings, from, to).map((t) => t.tabId);
      const newIndex = orderedIds.indexOf(activeTab.tabId);

      setTabs((prev) => reorderSiblingSubtrees(prev, parentKey, orderedIds));
      runTabAction({ action: 'updateTab', tabId: activeTab.tabId, index: newIndex });
    },
    [byId, visibleTabs, runTabAction]
  );

  if (loading && !hasFetched) {
    return (
      <div className={messageContainerClasses}>
        <span className={cn('text-xs', themeClasses.text.secondary)}>Loading tabs...</span>
      </div>
    );
  }

  if (error && !hasFetched) {
    return (
      <div className={messageContainerClasses}>
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
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className={containerClasses}>
        {tabs.length > 1 && (
          <button
            type="button"
            onClick={() => setReorderMode((value) => !value)}
            aria-label={reorderMode ? 'Lock tab order' : 'Reorder tabs'}
            aria-pressed={reorderMode}
            title={reorderMode ? 'Lock tab order' : 'Reorder tabs'}
            className={cn(
              'sticky left-0 z-10 mr-1 flex h-9 shrink-0 items-center rounded p-1.5 transition-colors',
              themeClasses.background.overlay,
              reorderMode ? 'text-accent' : themeClasses.text.tertiary,
              'hover:text-fg'
            )}
          >
            {reorderMode ? (
              <LuLockOpen className="h-4 w-4" aria-hidden />
            ) : (
              <LuLock className="h-4 w-4" aria-hidden />
            )}
          </button>
        )}

        <SortableContext items={visibleIds} strategy={horizontalListSortingStrategy}>
          {visibleTabs.map((tab) => (
            <SortableTab
              key={tab.tabId}
              tab={tab}
              isSelected={tab.tabId === selectedTabId}
              isEditing={tab.tabId === editingTabId}
              reorderMode={reorderMode}
              canDelete={tabs.length > 1}
              busy={busy}
              hasChildren={hasChildren(tab.tabId)}
              isCollapsed={collapsed.has(tab.tabId)}
              draftTitle={draftTitle}
              onDraftChange={setDraftTitle}
              onSelect={onSelectTab}
              onToggleCollapse={toggleCollapse}
              onBeginRename={beginRename}
              onCommitRename={commitRename}
              onCancelRename={() => setEditingTabId(null)}
              onAddSubTab={(t) => handleAddTab(t.tabId)}
              onDelete={handleDeleteTab}
            />
          ))}
        </SortableContext>

        {!reorderMode && (
          <button
            type="button"
            onClick={() => handleAddTab()}
            aria-label="Add tab"
            disabled={busy}
            className={cn(
              'ml-2 flex h-9 shrink-0 items-center gap-1 rounded px-2 text-xs transition-colors disabled:opacity-40',
              themeClasses.text.tertiary,
              'hover:text-fg'
            )}
          >
            <LuPlus className="h-4 w-4" aria-hidden />
            New tab
          </button>
        )}

        {error && hasFetched && (
          <span className={cn('ml-2 shrink-0', errorTextClasses)}>{error}</span>
        )}
      </div>
    </DndContext>
  );
}

interface SortableTabProps {
  tab: DocumentTab;
  isSelected: boolean;
  isEditing: boolean;
  reorderMode: boolean;
  canDelete: boolean;
  busy: boolean;
  hasChildren: boolean;
  isCollapsed: boolean;
  draftTitle: string;
  onDraftChange: (value: string) => void;
  onSelect: (tab: DocumentTab) => void;
  onToggleCollapse: (tab: DocumentTab) => void;
  onBeginRename: (tab: DocumentTab) => void;
  onCommitRename: (tab: DocumentTab) => void;
  onCancelRename: () => void;
  onAddSubTab: (tab: DocumentTab) => void;
  onDelete: (tab: DocumentTab) => void;
}

function SortableTab({
  tab,
  isSelected,
  isEditing,
  reorderMode,
  canDelete,
  busy,
  hasChildren,
  isCollapsed,
  draftTitle,
  onDraftChange,
  onSelect,
  onToggleCollapse,
  onBeginRename,
  onCommitRename,
  onCancelRename,
  onAddSubTab,
  onDelete,
}: SortableTabProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: tab.tabId,
    disabled: !reorderMode,
  });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex shrink-0 items-center gap-0.5 rounded-t-md border px-1 transition-colors',
        depthHeightClass(tab.nestingLevel),
        // Big left gap before a root tab separates sibling groups; nested tabs
        // sit snug under their parent so a group reads as one cluster.
        tab.nestingLevel === 0 ? 'ml-3' : 'ml-0.5',
        isSelected ? 'border-accent bg-surface' : 'border-line hover:bg-surface-muted',
        isDragging && 'opacity-80'
      )}
    >
      {reorderMode && (
        <button
          type="button"
          aria-label={`Reorder ${tab.title}`}
          className={cn(iconButtonClasses, 'cursor-grab touch-none active:cursor-grabbing')}
          {...attributes}
          {...listeners}
        >
          <LuGripVertical className="h-3.5 w-3.5" aria-hidden />
        </button>
      )}

      {!reorderMode && isSelected && !isEditing && (
        <TabOptionsMenu
          tab={tab}
          canDelete={canDelete}
          disabled={busy}
          onRename={onBeginRename}
          onDelete={onDelete}
        />
      )}

      {tab.nestingLevel > 0 && !isEditing && (
        <span
          role="img"
          aria-label={`Nesting level ${tab.nestingLevel}`}
          title={`Level ${tab.nestingLevel} sub-tab`}
          className={cn(
            'no-rainbow-border flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold leading-none',
            themeClasses.border.default,
            themeClasses.text.tertiary
          )}
        >
          {tab.nestingLevel}
        </span>
      )}

      {isEditing ? (
        <input
          autoFocus
          value={draftTitle}
          onChange={(event) => onDraftChange(event.target.value)}
          onBlur={() => onCommitRename(tab)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              onCommitRename(tab);
            } else if (event.key === 'Escape') {
              event.preventDefault();
              onCancelRename();
            }
          }}
          aria-label={`Rename tab ${tab.title}`}
          className={cn(
            'my-1 w-28 rounded border px-2 py-1 text-xs',
            themeClasses.border.default,
            themeClasses.background.overlay,
            themeClasses.text.primary
          )}
        />
      ) : (
        <button
          onClick={() => onSelect(tab)}
          onDoubleClick={() => onBeginRename(tab)}
          className={cn(
            'px-2 py-1 text-xs font-medium whitespace-nowrap transition-colors',
            isSelected ? 'text-accent' : cn(themeClasses.text.secondary, 'hover:text-fg')
          )}
        >
          {tab.title}
        </button>
      )}

      {hasChildren && !isEditing && (
        <button
          type="button"
          onClick={() => onToggleCollapse(tab)}
          aria-label={`${isCollapsed ? 'Expand' : 'Collapse'} sub-tabs of ${tab.title}`}
          className={iconButtonClasses}
        >
          {isCollapsed ? (
            <LuChevronRight className="h-3.5 w-3.5" aria-hidden />
          ) : (
            <LuChevronDown className="h-3.5 w-3.5" aria-hidden />
          )}
        </button>
      )}

      {!reorderMode && isSelected && !isEditing && (
        <button
          type="button"
          onClick={() => onAddSubTab(tab)}
          aria-label={`Add sub-tab under ${tab.title}`}
          disabled={busy}
          className={iconButtonClasses}
        >
          <LuPlus className="h-3.5 w-3.5" aria-hidden />
        </button>
      )}
    </div>
  );
}

interface TabOptionsMenuProps {
  tab: DocumentTab;
  canDelete: boolean;
  disabled: boolean;
  onRename: (tab: DocumentTab) => void;
  onDelete: (tab: DocumentTab) => void;
}

// Gear-triggered popover holding Rename/Delete. Portaled + fixed-positioned so
// it isn't clipped by the tab bar's horizontal overflow scroll.
function TabOptionsMenu({ tab, canDelete, disabled, onRename, onDelete }: TabOptionsMenuProps) {
  const label = `Tab options for ${tab.title}`;
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;

    const reposition = () => {
      const rect = buttonRef.current!.getBoundingClientRect();
      const width = 160;
      const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : width;
      const left = Math.min(Math.max(rect.left, 8), Math.max(8, viewportWidth - width - 8));
      setPosition({ top: rect.bottom + 6, left });
    };

    reposition();
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    return () => {
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handlePointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('pointerdown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('pointerdown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={disabled}
        className={iconButtonClasses}
      >
        <LuEllipsisVertical className="h-3.5 w-3.5" aria-hidden />
      </button>
      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-label={label}
            style={
              position
                ? { position: 'fixed', top: position.top, left: position.left, width: 160 }
                : { position: 'fixed', visibility: 'hidden' }
            }
            className="z-50 flex flex-col rounded-md border border-line bg-surface p-1 text-sm shadow-lg"
          >
            <button
              type="button"
              role="menuitem"
              aria-label={`Rename tab ${tab.title}`}
              onClick={() => {
                setOpen(false);
                onRename(tab);
              }}
              className="flex items-center gap-2 rounded px-2 py-1.5 text-left text-fg-subtle transition-colors hover:bg-surface-muted hover:text-fg"
            >
              <LuPencil className="h-3.5 w-3.5" aria-hidden />
              Rename
            </button>
            {canDelete && (
              <button
                type="button"
                role="menuitem"
                aria-label={`Delete tab ${tab.title}`}
                onClick={() => {
                  setOpen(false);
                  onDelete(tab);
                }}
                className="flex items-center gap-2 rounded px-2 py-1.5 text-left text-red-600 transition-colors hover:bg-red-500/10 dark:text-red-400"
              >
                <LuTrash2 className="h-3.5 w-3.5" aria-hidden />
                Delete
              </button>
            )}
          </div>,
          document.body
        )}
    </>
  );
}
