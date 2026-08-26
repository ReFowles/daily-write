"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/class-utils";
import { themeClasses } from "@/lib/theme-utils";

interface NavLinksProps {
  orientation?: "horizontal" | "vertical";
}

export default function NavLinks({ orientation = "horizontal" }: NavLinksProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const navItems = [
    { name: "Dashboard", href: "/", requireAuth: true },
    { name: "Write", href: "/write", requireAuth: true },
    { name: "Goals", href: "/goals", requireAuth: true },
    { name: "About", href: "/about", requireAuth: false },
  ];

  const visibleItems = navItems.filter(
    (item) => !item.requireAuth || session
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
