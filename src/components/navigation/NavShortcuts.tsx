"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useCurrentGoal } from "@/lib/use-current-goal";

export function NavShortcuts() {
  const pathname = usePathname();
  const showWrite = pathname !== "/write";
  const { currentGoal, isLoading } = useCurrentGoal();

  // When an active goal exists, the "New Goal" shortcut becomes redundant, so
  // repurpose it as a Dashboard shortcut. Hide it on the dashboard itself.
  const hasActiveGoal = !isLoading && !!currentGoal;
  const showDashboardShortcut = hasActiveGoal && pathname !== "/";
  const showNewGoalShortcut = !hasActiveGoal;

  return (
    <div className="flex items-center gap-2">
      {showWrite && (
        <Link href="/write">
          <Button variant="primary" className="w-30" aria-label="Write">
            Write
          </Button>
        </Link>
      )}
      {showDashboardShortcut && (
        <Link href="/">
          <Button variant="secondary" className="w-30" aria-label="Go to dashboard">
            Current Goal
          </Button>
        </Link>
      )}
      {showNewGoalShortcut && (
        <Link href="/goals?new=true">
          <Button variant="secondary" className="w-30" aria-label="Create new goal">
            New Goal
          </Button>
        </Link>
      )}
    </div>
  );
}

export default NavShortcuts;
