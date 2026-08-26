import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { calculateDaysLeft, toDateString } from "./date-utils";
import { getCurrentGoal, getWritingSessionByDate } from "./data-store";
import type { Goal } from "./types";

export interface CurrentGoalData {
  todayGoal: number;
  todayProgress: number;
  daysLeft: number;
  currentGoal: Goal | undefined;
  isLoading: boolean;
}

interface CacheEntry {
  currentGoal: Goal | undefined;
  todayProgress: number;
  dateString: string;
}

// Module-level cache so header stats survive client-side route changes
// instead of flashing zeros while each page re-fetches.
const cache = new Map<string, CacheEntry>();

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
  const [isLoading, setIsLoading] = useState<boolean>(!initialFresh && !!userEmail);

  useEffect(() => {
    if (!userEmail) {
      setCurrentGoal(undefined);
      setTodayProgress(0);
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
        cache.set(userEmail, {
          currentGoal: nextGoal,
          todayProgress: nextProgress,
          dateString,
        });
        setCurrentGoal(nextGoal);
        setTodayProgress(nextProgress);
      } catch (error) {
        console.error("Error fetching current goal data:", error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [userEmail]);

  const todayGoal = currentGoal?.dailyWordTarget || 0;
  const daysLeft = currentGoal ? calculateDaysLeft(currentGoal.endDate) : 0;

  return {
    todayGoal,
    todayProgress,
    daysLeft,
    currentGoal,
    isLoading,
  };
}
