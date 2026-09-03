"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { LuGripVertical } from "react-icons/lu";
import { cn } from "@/lib/class-utils";
import { themeClasses } from "@/lib/theme-utils";

export interface SortableCardItem {
  id: string;
  content: ReactNode;
}

interface SortableCardsProps {
  items: SortableCardItem[];
  /** localStorage key for persisting the user's card order. */
  storageKey: string;
  /** "list" stacks items vertically; "grid" arranges them in a responsive grid. */
  layout?: "list" | "grid";
  /** When true, hides drag handles and disables reordering. */
  locked?: boolean;
  className?: string;
}

/**
 * Reconciles a saved id ordering with the currently-available ids so newly
 * added cards appear (appended) and removed ids are dropped.
 */
function reconcileOrder(saved: string[] | null, ids: string[]): string[] {
  if (!saved) return ids;
  const known = new Set(ids);
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const id of saved) {
    if (known.has(id) && !seen.has(id)) {
      ordered.push(id);
      seen.add(id);
    }
  }
  for (const id of ids) {
    if (!seen.has(id)) ordered.push(id);
  }
  return ordered;
}

const LAYOUT_CLASSES: Record<NonNullable<SortableCardsProps["layout"]>, string> = {
  list: "flex flex-col gap-6 sm:gap-8",
  grid: "grid gap-6 sm:grid-cols-2 lg:grid-cols-4",
};

export function SortableCards({
  items,
  storageKey,
  layout = "list",
  locked = false,
  className,
}: SortableCardsProps) {
  const ids = useMemo(() => items.map((i) => i.id), [items]);
  const [order, setOrder] = useState<string[]>(ids);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      const saved = raw ? (JSON.parse(raw) as string[]) : null;
      setOrder(reconcileOrder(saved, ids));
    } catch {
      setOrder(ids);
    } finally {
      setHydrated(true);
    }
  }, [storageKey, ids]);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    window.localStorage.setItem(storageKey, JSON.stringify(order));
  }, [order, storageKey, hydrated]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    // Touch: brief long-press so vertical swipes still scroll the page and
    // only a deliberate hold-then-move starts a drag.
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setOrder((current) => {
      const from = current.indexOf(String(active.id));
      const to = current.indexOf(String(over.id));
      if (from === -1 || to === -1) return current;
      return arrayMove(current, from, to);
    });
  };

  const byId = useMemo(() => {
    const map = new Map<string, ReactNode>();
    items.forEach((item) => map.set(item.id, item.content));
    return map;
  }, [items]);

  const strategy = layout === "grid" ? rectSortingStrategy : verticalListSortingStrategy;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={order} strategy={strategy}>
        <div className={cn(LAYOUT_CLASSES[layout], className)}>
          {order.map((id) => {
            const content = byId.get(id);
            if (!content) return null;
            return (
              <SortableCard key={id} id={id} locked={locked}>
                {content}
              </SortableCard>
            );
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
}

interface SortableCardProps {
  id: string;
  locked: boolean;
  children: ReactNode;
}

function SortableCard({ id, locked, children }: SortableCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id, disabled: locked });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative",
        // Widen the direct child Card's left padding so the absolutely-
        // positioned grip in the corner sits to the left of the section
        // header instead of overlapping it. Skipped when locked so the card
        // reclaims its normal padding.
        !locked && "[&>div]:pl-12",
        isDragging && "opacity-80 shadow-lg"
      )}
    >
      {!locked && (
        <button
          type="button"
          className={cn(
            "absolute left-3 top-4 z-10 flex h-8 w-6 cursor-grab items-center justify-center rounded-md",
            // touch-none on the handle only, so swipes over the rest of the
            // card still scroll the page on mobile.
            "touch-none",
            "opacity-40 transition-opacity hover:opacity-100 focus-visible:opacity-100",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
            "active:cursor-grabbing",
            themeClasses.text.secondary
          )}
          aria-label="Reorder card"
          {...attributes}
          {...listeners}
        >
          <LuGripVertical className="h-5 w-5" />
        </button>
      )}
      {children}
    </div>
  );
}

