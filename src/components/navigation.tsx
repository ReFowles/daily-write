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
    <nav className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 strawberry:border-pink-200 strawberry:bg-linear-to-r strawberry:from-pink-50 strawberry:to-rose-50 dark-strawberry:border-rose-900 dark-strawberry:bg-linear-to-r dark-strawberry:from-rose-950 dark-strawberry:to-pink-950 ocean:border-cyan-200 ocean:bg-linear-to-r ocean:from-cyan-50 ocean:to-blue-50 dark-ocean:border-cyan-900 dark-ocean:bg-linear-to-r dark-ocean:from-cyan-950 dark-ocean:to-blue-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold text-zinc-900 dark:text-zinc-50 strawberry:text-rose-700 dark-strawberry:text-rose-300 ocean:text-cyan-700 dark-ocean:text-cyan-300">
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
                      ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50 strawberry:bg-rose-100 strawberry:text-rose-900 dark-strawberry:bg-rose-900 dark-strawberry:text-rose-100 ocean:bg-cyan-100 ocean:text-cyan-900 dark-ocean:bg-cyan-900 dark-ocean:text-cyan-100"
                      : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50 strawberry:text-rose-700 strawberry:hover:bg-pink-100 strawberry:hover:text-rose-900 dark-strawberry:text-rose-400 dark-strawberry:hover:bg-rose-900 dark-strawberry:hover:text-rose-100 ocean:text-cyan-700 ocean:hover:bg-cyan-100 ocean:hover:text-cyan-900 dark-ocean:text-cyan-400 dark-ocean:hover:bg-cyan-900 dark-ocean:hover:text-cyan-100"
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
            <button className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900 strawberry:border-rose-300 strawberry:bg-white strawberry:text-rose-700 strawberry:hover:bg-rose-50 dark-strawberry:border-rose-700 dark-strawberry:bg-rose-950 dark-strawberry:text-rose-300 dark-strawberry:hover:bg-rose-900 ocean:border-cyan-300 ocean:bg-white ocean:text-cyan-700 ocean:hover:bg-cyan-50 dark-ocean:border-cyan-700 dark-ocean:bg-cyan-950 dark-ocean:text-cyan-300 dark-ocean:hover:bg-cyan-900">
              Sign In
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
