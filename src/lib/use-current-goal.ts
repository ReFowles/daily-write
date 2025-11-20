import { calculateDaysLeft } from "./date-utils";
import dummyData from "./dummy-data.json";

export interface CurrentGoalData {
  todayGoal: number;
  todayProgress: number;
  daysLeft: number;
  currentGoal: typeof dummyData.goals[0] | undefined;
}

export function useCurrentGoal(): CurrentGoalData {
  // Get today's date
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayString = today.toISOString().split('T')[0];

  // Find the current goal (the goal that covers today's date)
  const currentGoal = dummyData.goals.find(goal => {
    const startDate = new Date(goal.startDate + 'T00:00:00');
    const endDate = new Date(goal.endDate + 'T00:00:00');
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
