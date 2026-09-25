import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { calculateDaysLeft, getEffectiveDailyTarget, toDateString } from "./date-utils";
import {
  adjustManualProgress as adjustManualProgressInDb,
  getCurrentGoal,
  getWritingSessionByDate,
  getWritingSessionsInRange,
} from "./data-store";
import type { Goal } from "./types";

/**
 * Header-ready view of an active manual goal's completion counter. Present only
 * when the current goal is manual.
 */
export interface ManualHeaderInfo {
  label: string;
  completed: number;
  total: number;
  dailyTarget: number;
  onIncrement: () => void;
  onDecrement: () => void;
}

export interface CurrentGoalData {
  todayGoal: number;
  todayProgress: number;
  daysLeft: number;
  currentGoal: Goal | undefined;
  manualGoal?: ManualHeaderInfo;
  isLoading: boolean;
}

interface CacheEntry {
  currentGoal: Goal | undefined;
  todayProgress: number;
  wordsWrittenBeforeToday: number;
  manualCompleted: number;
  dateString: string;
}

// Module-level cache so header stats survive client-side route changes
// instead of flashing zeros while each page re-fetches.
const cache = new Map<string, CacheEntry>();

// Notifies already-mounted hook instances (e.g. nav shortcuts, which persist
// across route changes) to refetch after another component invalidates the cache.
const listeners = new Set<() => void>();

function todayDateString(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return toDateString(d);
}

export function invalidateCurrentGoalCache(userId?: string): void {
  if (userId) {
    cache.delete(userId);
  } else {
    cache.clear();
  }
  listeners.forEach((listener) => listener());
}

export function useCurrentGoal(): CurrentGoalData {
  const { data: session } = useSession();
  const userEmail = session?.user?.email ?? null;

  const initialCached = userEmail ? cache.get(userEmail) : undefined;
  const initialFresh =
    !!initialCached && initialCached.dateString === todayDateString();

  const [currentGoal, setCurrentGoal] = useState<Goal | undefined>(
    initialFresh ? initialCached!.currentGoal : undefined
  );
  const [todayProgress, setTodayProgress] = useState<number>(
    initialFresh ? initialCached!.todayProgress : 0
  );
  const [wordsWrittenBeforeToday, setWordsWrittenBeforeToday] = useState<number>(
    initialFresh ? initialCached!.wordsWrittenBeforeToday : 0
  );
  const [manualCompleted, setManualCompleted] = useState<number>(
    initialFresh ? initialCached!.manualCompleted : 0
  );
  const [isLoading, setIsLoading] = useState<boolean>(!initialFresh && !!userEmail);
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    const listener = () => setRefreshIndex((i) => i + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  useEffect(() => {
    if (!userEmail) {
      setCurrentGoal(undefined);
      setTodayProgress(0);
      setWordsWrittenBeforeToday(0);
      setIsLoading(false);
      return;
    }

    let mounted = true;
    const dateString = todayDateString();
    const cached = cache.get(userEmail);
    const fresh = !!cached && cached.dateString === dateString;

    if (fresh) {
      // Show cached values immediately, then refresh in the background.
      setCurrentGoal(cached!.currentGoal);
      setTodayProgress(cached!.todayProgress);
      setWordsWrittenBeforeToday(cached!.wordsWrittenBeforeToday);
      setManualCompleted(cached!.manualCompleted);
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }

    (async () => {
      try {
        const [goal, todaySession] = await Promise.all([
          getCurrentGoal(userEmail),
          getWritingSessionByDate(userEmail, dateString),
        ]);
        if (!mounted) return;
        const nextGoal = goal || undefined;
        const nextProgress = todaySession?.wordCount || 0;

        // Live goals need the running total from goal start through yesterday
        // to recompute today's daily target.
        let nextWordsBefore = 0;
        if (nextGoal && nextGoal.mode === "live") {
          const sessions = await getWritingSessionsInRange(
            userEmail,
            nextGoal.startDate,
            dateString
          );
          if (!mounted) return;
          // Cheat days never count toward the running total.
          const cheatDays = new Set(nextGoal.cheatDaysUsed ?? []);
          nextWordsBefore = sessions
            .filter((s) => s.date < dateString && !cheatDays.has(s.date))
            .reduce((sum, s) => sum + s.wordCount, 0);
        }

        cache.set(userEmail, {
          currentGoal: nextGoal,
          todayProgress: nextProgress,
          wordsWrittenBeforeToday: nextWordsBefore,
          manualCompleted: nextGoal?.completedUnits ?? 0,
          dateString,
        });
        setCurrentGoal(nextGoal);
        setTodayProgress(nextProgress);
        setWordsWrittenBeforeToday(nextWordsBefore);
        setManualCompleted(nextGoal?.completedUnits ?? 0);
      } catch (error) {
        console.error("Error fetching current goal data:", error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [userEmail, refreshIndex]);

  // Manual goals pace against the completion counter; word goals against words
  // logged before today.
  const beforeToday =
    currentGoal?.kind === "manual" ? manualCompleted : wordsWrittenBeforeToday;
  const todayGoal = currentGoal
    ? getEffectiveDailyTarget(currentGoal, todayDateString(), beforeToday)
    : 0;
  const daysLeft = currentGoal ? calculateDaysLeft(currentGoal.endDate) : 0;

  const adjustManualProgress = useCallback(
    (delta: number) => {
      if (!userEmail || !currentGoal || currentGoal.kind !== "manual") return;

      const goalId = currentGoal.id;
      const total = currentGoal.totalWordTarget;

      // Optimistically clamp and reflect the change immediately.
      const applyLocal = (value: number) => {
        const clamped = Math.max(0, Math.min(total, value));
        setManualCompleted(clamped);
        const cached = cache.get(userEmail);
        if (cached) {
          cache.set(userEmail, {
            ...cached,
            manualCompleted: clamped,
            currentGoal: cached.currentGoal
              ? { ...cached.currentGoal, completedUnits: clamped }
              : cached.currentGoal,
          });
        }
        return clamped;
      };

      applyLocal(manualCompleted + delta);

      (async () => {
        try {
          const next = await adjustManualProgressInDb(goalId, delta);
          applyLocal(next);
          listeners.forEach((listener) => listener());
        } catch (error) {
          console.error("Error updating manual progress:", error);
          invalidateCurrentGoalCache(userEmail);
        }
      })();
    },
    [userEmail, currentGoal, manualCompleted]
  );

  const manualGoal: ManualHeaderInfo | undefined =
    currentGoal && currentGoal.kind === "manual"
      ? {
          label: currentGoal.unitLabel ?? "",
          completed: manualCompleted,
          total: currentGoal.totalWordTarget,
          dailyTarget: todayGoal,
          onIncrement: () => adjustManualProgress(1),
          onDecrement: () => adjustManualProgress(-1),
        }
      : undefined;

  return {
    todayGoal,
    todayProgress,
    daysLeft,
    currentGoal,
    manualGoal,
    isLoading,
  };
}
