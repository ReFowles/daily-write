"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { LuMenu, LuX } from "react-icons/lu";
import { cn } from "@/lib/class-utils";
import { themeClasses } from "@/lib/theme-utils";

interface MobileNavMenuProps {
  children: ReactNode;
}

export function MobileNavMenu({ children }: MobileNavMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [lastPath, setLastPath] = useState<string | null>(null);
  const pathname = usePathname();

  // Close the panel when navigating (derive from props pattern).
  if (pathname !== lastPath) {
    setLastPath(pathname);
    if (isOpen) setIsOpen(false);
  }

  // Prevent background scroll while the panel is open.
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        aria-controls="mobile-nav-panel"
        aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
        className={cn(
          "inline-flex h-10 w-10 items-center justify-center rounded-md lg:hidden",
          "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800",
          "strawberry:text-rose-700 strawberry:hover:bg-pink-100",
          "cherry:text-rose-300 cherry:hover:bg-rose-900",
          "seafoam:text-cyan-700 seafoam:hover:bg-cyan-100",
          "ocean:text-cyan-300 ocean:hover:bg-cyan-900"
        )}
      >
        {isOpen ? <LuX className="h-5 w-5" /> : <LuMenu className="h-5 w-5" />}
      </button>

      {isOpen && (
        <>
          {/* Blurred backdrop below the nav; click closes the panel */}
          <div
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
            className="fixed inset-x-0 bottom-0 top-16 z-30 bg-black/30 backdrop-blur-sm lg:hidden"
          />
          <div
            id="mobile-nav-panel"
            className={cn(
              "absolute inset-x-0 top-16 z-40 border-b shadow-lg lg:hidden",
              themeClasses.border.navBar,
              themeClasses.background.navBar
            )}
          >
            <div className="mx-auto max-w-7xl px-4 py-4 flex flex-col gap-3">
              {children}
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default MobileNavMenu;
