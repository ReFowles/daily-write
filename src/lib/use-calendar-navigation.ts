import { useState } from "react";

interface CalendarNavigationReturn {
  year: number;
  month: number;
  goToPreviousMonth: () => void;
  goToNextMonth: () => void;
  goToToday: () => void;
}

/**
 * Custom hook for managing calendar month navigation
 * Handles month/year state and provides navigation functions
 */
export function useCalendarNavigation(
  initialYear?: number,
  initialMonth?: number
): CalendarNavigationReturn {
  const today = new Date();
  const [year, setYear] = useState(initialYear ?? today.getFullYear());
  const [month, setMonth] = useState(initialMonth ?? today.getMonth());

  const goToPreviousMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const goToNextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const goToToday = () => {
    const now = new Date();
    setYear(now.getFullYear());
    setMonth(now.getMonth());
  };

  return {
    year,
    month,
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
  };
}
