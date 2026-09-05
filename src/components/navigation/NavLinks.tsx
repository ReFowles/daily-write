"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/class-utils";
import { themeClasses } from "@/lib/theme-utils";

interface NavLinksProps {
  orientation?: "horizontal" | "vertical";
  isSignedIn: boolean;
}

export default function NavLinks({
  orientation = "horizontal",
  isSignedIn,
}: NavLinksProps) {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/", requireAuth: true },
    { name: "Write", href: "/write", requireAuth: true },
    { name: "Goals", href: "/goals", requireAuth: true },
    { name: "About", href: "/about", requireAuth: false },
  ];

  const visibleItems = navItems.filter(
    (item) => !item.requireAuth || isSignedIn
  );

  const isVertical = orientation === "vertical";

  return (
    <div
      className={cn(
        "flex items-center gap-1",
        isVertical && "flex-col items-stretch gap-1"
      )}
    >
      {visibleItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              themeClasses.nav.link,
              isVertical && "block w-full",
              isActive ? themeClasses.nav.linkActive : themeClasses.nav.linkInactive
            )}
          >
            {item.name}
          </Link>
        );
      })}
    </div>
  );
}
