"use client";

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { LuTriangleAlert } from "react-icons/lu";
import { cn } from "@/lib/class-utils";
import { themeClasses } from "@/lib/theme-utils";

const POPOVER_WIDTH = 288; // px, matches w-72
const VIEWPORT_MARGIN = 12;
const DISMISSED_STORAGE_KEY = "unverified-notice-seen";

const seenListeners = new Set<() => void>();

function subscribeToSeen(callback: () => void) {
  seenListeners.add(callback);
  return () => {
    seenListeners.delete(callback);
  };
}

function getSeenSnapshot() {
  try {
    return localStorage.getItem(DISMISSED_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

// SSR: pretend the notice was already seen so the animation classes aren't rendered on the server;
// useSyncExternalStore hydrates cleanly to the real client value.
function getSeenServerSnapshot() {
  return true;
}

function markNoticeSeen() {
  try {
    localStorage.setItem(DISMISSED_STORAGE_KEY, "1");
  } catch {
    // localStorage may be unavailable (private mode); the animation just replays next mount.
  }
  seenListeners.forEach((fn) => fn());
}

export function UnverifiedAppNotice() {
  const [isOpen, setIsOpen] = useState(false);
  const hasBeenSeen = useSyncExternalStore(subscribeToSeen, getSeenSnapshot, getSeenServerSnapshot);
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

  const attract = !isOpen && !hasBeenSeen;

  return (
    <div className="relative inline-flex">
      {attract && (
        <span
          aria-hidden
          className="notice-attract-tap pointer-events-none absolute inset-0 rounded-full border-2 border-amber-500/70 dark:border-amber-400/70"
        />
      )}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          setIsOpen((open) => !open);
          if (!hasBeenSeen) markNoticeSeen();
        }}
        aria-expanded={isOpen}
        aria-label="Why does Google show an unverified app warning?"
        className={cn(
          "relative inline-flex h-9 w-9 items-center justify-center rounded-md text-amber-600 transition-colors hover:bg-amber-500/15 dark:text-amber-400",
          attract && "notice-attract-wiggle"
        )}
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
