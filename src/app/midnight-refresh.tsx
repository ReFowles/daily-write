"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toDateString } from "@/lib/date-utils";

/**
 * Keeps server-rendered "today" data (goals, streaks, calendars) fresh across
 * a midnight rollover for tabs left open.
 *
 * A `setTimeout` fires shortly after local midnight, but background tabs are
 * throttled by the browser and may not fire exactly on time (or at all until
 * the tab regains focus). To cover that gap, we also re-check the date
 * whenever the tab becomes visible/focused again and refresh if the day has
 * changed since we last checked.
 */
export default function MidnightRefresh() {
  const router = useRouter();
  const lastDateRef = useRef(toDateString(new Date()));

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const refreshIfDayChanged = () => {
      const currentDate = toDateString(new Date());
      if (currentDate !== lastDateRef.current) {
        lastDateRef.current = currentDate;
        router.refresh();
      }
    };

    const scheduleNextMidnight = () => {
      const now = new Date();
      const nextMidnight = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        0,
        0,
        1 // one second past midnight, to be safely on the new day
      );
      const msUntilMidnight = nextMidnight.getTime() - now.getTime();

      timeoutId = setTimeout(() => {
        refreshIfDayChanged();
        scheduleNextMidnight();
      }, msUntilMidnight);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshIfDayChanged();
      }
    };

    scheduleNextMidnight();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", refreshIfDayChanged);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", refreshIfDayChanged);
    };
  }, [router]);

  return null;
}
