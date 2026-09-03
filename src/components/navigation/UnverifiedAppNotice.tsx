"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { LuTriangleAlert } from "react-icons/lu";
import { cn } from "@/lib/class-utils";
import { themeClasses } from "@/lib/theme-utils";

const POPOVER_WIDTH = 288; // px, matches w-72
const VIEWPORT_MARGIN = 12;

export function UnverifiedAppNotice() {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!isOpen || !buttonRef.current) return;

    function reposition() {
      const rect = buttonRef.current!.getBoundingClientRect();
      const left = Math.min(
        Math.max(rect.right - POPOVER_WIDTH, VIEWPORT_MARGIN),
        window.innerWidth - POPOVER_WIDTH - VIEWPORT_MARGIN
      );
      setPosition({ top: rect.bottom + 8, left });
    }

    reposition();
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (!buttonRef.current?.contains(target) && !popoverRef.current?.contains(target)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="inline-flex">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-label="Why does Google show an unverified app warning?"
        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-amber-600 transition-colors hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-950 strawberry:text-amber-600 strawberry:hover:bg-amber-100 cherry:text-amber-400 cherry:hover:bg-amber-950 seafoam:text-amber-600 seafoam:hover:bg-amber-100 ocean:text-amber-400 ocean:hover:bg-amber-950"
      >
        <LuTriangleAlert className="h-5 w-5" aria-hidden />
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={popoverRef}
            role="dialog"
            style={{ top: position.top, left: position.left, width: POPOVER_WIDTH }}
            className={cn(
              "fixed z-50 rounded-lg border p-4 text-sm shadow-lg",
              themeClasses.border.default,
              themeClasses.background.overlay,
              themeClasses.text.secondary
            )}
          >
            <p className={cn("font-semibold", themeClasses.text.primary)}>
              Google will flag this app as unverified
            </p>
            <p className="mt-2 leading-relaxed">
              DailyWrite requests Google Drive and Docs access, which Google treats as sensitive.
              Full verification requires a paid security review, so during sign-in you&apos;ll see
              a &quot;Google hasn&apos;t verified this app&quot; screen. Click{" "}
              <strong>Advanced</strong>, then{" "}
              <strong>Go to DailyWrite (unsafe)</strong> to continue — this is expected, and your
              data stays private to your own Google account.
            </p>
          </div>,
          document.body
        )}
    </div>
  );
}
