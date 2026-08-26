"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "./ui/Button";

export function NavShortcuts() {
  const pathname = usePathname();
  const showWrite = pathname !== "/write";

  return (
    <div className="flex items-center gap-2">
      {showWrite && (
        <Link href="/write">
          <Button variant="primary" className="w-30" aria-label="Write">
            Write
          </Button>
        </Link>
      )}
      <Link href="/goals?new=true">
        <Button variant="secondary" className="w-30" aria-label="Create new goal">
          New Goal
        </Button>
      </Link>
    </div>
  );
}

export default NavShortcuts;
