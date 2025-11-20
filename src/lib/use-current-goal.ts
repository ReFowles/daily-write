import { calculateDaysLeft, parseLocalDate } from "./date-utils";
import type { Goal } from "./types";
import dummyData from "./dummy-data.json";

export interface CurrentGoalData {
  todayGoal: number;
  todayProgress: number;
  daysLeft: number;
  currentGoal: Goal | undefined;
}

export function useCurrentGoal(): CurrentGoalData {
  // Get today's date
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayString = today.toISOString().split('T')[0];

  // Find the current goal (the goal that covers today's date)
  const currentGoal = (dummyData.goals as Goal[]).find(goal => {
    const startDate = parseLocalDate(goal.startDate);
    const endDate = parseLocalDate(goal.endDate);
    return today >= startDate && today <= endDate;
  });

  const todayGoal = currentGoal?.dailyWordTarget || 500;

  // Find today's writing session
  const todaySession = dummyData.writingSessions.find(
    session => session.date === todayString
  );
  const todayProgress = todaySession?.wordCount || 0;

  // Calculate days left in current goal
  const daysLeft = currentGoal ? calculateDaysLeft(currentGoal.endDate) : 0;

  return {
    todayGoal,
    todayProgress,
    daysLeft,
    currentGoal,
  };
}
