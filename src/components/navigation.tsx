"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import iconSvg from "../app/icon.svg";
import { Button } from "./ui/Button";
import { themeClasses } from "@/lib/theme-utils";
import { cn } from "@/lib/class-utils";

export default function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/" },
    { name: "Write", href: "/write" },
    { name: "History", href: "/history" },
    { name: "Goals", href: "/goals" },
  ];

  return (
    <nav className={cn("border-b", themeClasses.border.navBar, themeClasses.background.navBar)}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <Image src={iconSvg} alt="DailyWrite logo" width={32} height={32} className="h-8 w-8" />
              <span className={cn("text-xl font-bold", themeClasses.text.link)}>
                DailyWrite
              </span>
            </Link>
          </div>
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
          {/* Placeholder for future Google Auth button */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="secondary">
              Sign In
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
