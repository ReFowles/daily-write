import { useEffect, useState } from "react";
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
  const [currentGoal, setCurrentGoal] = useState<Goal | undefined>(undefined);
  const [todayProgress, setTodayProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      try {
        setIsLoading(true);
        
        // Get today's date string
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayString = today.toISOString().split('T')[0];

        // Fetch current goal and today's session in parallel
        const [goal, session] = await Promise.all([
          getCurrentGoal(),
          getWritingSessionByDate(todayString),
        ]);

        if (!mounted) return;

        setCurrentGoal(goal || undefined);
        setTodayProgress(session?.wordCount || 0);
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
  }, []);

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
