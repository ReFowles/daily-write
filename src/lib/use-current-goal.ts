import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { calculateDaysLeft } from "./date-utils";
import { getCurrentGoal, getWritingSessionByDate } from "./data-store";
import type { Goal } from "./types";

export interface CurrentGoalData {
  todayGoal: number;
  todayProgress: number;
  daysLeft: number;
  currentGoal: Goal | undefined;
  isLoading: boolean;
}

export function useCurrentGoal(): CurrentGoalData {
  const { data: session } = useSession();
  const [currentGoal, setCurrentGoal] = useState<Goal | undefined>(undefined);
  const [todayProgress, setTodayProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.email) {
      setIsLoading(false);
      return;
    }

    let mounted = true;

    async function fetchData() {
      if (!session?.user?.email) return;

      try {
        setIsLoading(true);
        
        const userId = session.user.email;
        
        // Get today's date string
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        // Fetch current goal and today's session in parallel
        const [goal, todaySession] = await Promise.all([
          getCurrentGoal(userId),
          getWritingSessionByDate(userId, todayString),
        ]);

        if (!mounted) return;

        setCurrentGoal(goal || undefined);
        setTodayProgress(todaySession?.wordCount || 0);
      } catch (error) {
        console.error("Error fetching current goal data:", error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      mounted = false;
    };
  }, [session]);

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
