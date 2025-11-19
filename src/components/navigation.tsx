"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "./theme-toggle";

export default function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/" },
    { name: "Write", href: "/write" },
    { name: "History", href: "/history" },
  ];

  return (
    <nav className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 strawberry:border-pink-200 strawberry:bg-linear-to-r strawberry:from-pink-50 strawberry:to-rose-50 cherry:border-rose-900 cherry:bg-linear-to-r cherry:from-rose-950 cherry:to-pink-950 seafoam:border-cyan-200 seafoam:bg-linear-to-r seafoam:from-cyan-50 seafoam:to-blue-50 ocean:border-cyan-900 ocean:bg-linear-to-r ocean:from-cyan-950 ocean:to-blue-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold text-zinc-900 dark:text-zinc-50 strawberry:text-rose-700 cherry:text-rose-300 seafoam:text-cyan-700 ocean:text-cyan-300">
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
                  className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50 strawberry:bg-rose-100 strawberry:text-rose-900 cherry:bg-rose-900 cherry:text-rose-100 seafoam:bg-cyan-100 seafoam:text-cyan-900 ocean:bg-cyan-900 ocean:text-cyan-100"
                      : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50 strawberry:text-rose-700 strawberry:hover:bg-pink-100 strawberry:hover:text-rose-900 cherry:text-rose-400 cherry:hover:bg-rose-900 cherry:hover:text-rose-100 seafoam:text-cyan-700 seafoam:hover:bg-cyan-100 seafoam:hover:text-cyan-900 ocean:text-cyan-400 ocean:hover:bg-cyan-900 ocean:hover:text-cyan-100"
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>
          {/* Placeholder for future Google Auth button */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900 strawberry:border-rose-300 strawberry:bg-white strawberry:text-rose-700 strawberry:hover:bg-rose-50 cherry:border-rose-700 cherry:bg-rose-950 cherry:text-rose-300 cherry:hover:bg-rose-900 seafoam:border-cyan-300 seafoam:bg-white seafoam:text-cyan-700 seafoam:hover:bg-cyan-50 ocean:border-cyan-700 ocean:bg-cyan-950 ocean:text-cyan-300 ocean:hover:bg-cyan-900">
              Sign In
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
