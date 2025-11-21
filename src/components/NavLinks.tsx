"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/class-utils";
import { themeClasses } from "@/lib/theme-utils";

export default function NavLinks() {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/" },
    { name: "Write", href: "/write" },
    { name: "History", href: "/history" },
    { name: "Goals", href: "/goals" },
  ];

  return (
    <div className="flex items-center gap-1">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              themeClasses.nav.link,
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
