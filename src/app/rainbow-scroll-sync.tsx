"use client";

import { useEffect } from "react";

/**
 * Publishes the current window scroll offset as `--scroll-x` / `--scroll-y`
 * on `<html>`. The Energy / Ambition themes fold these into the rainbow's
 * `background-position` so that a `background-attachment: fixed` gradient
 * (which is normally anchored to the viewport) instead behaves as if it is
 * anchored to the document — every rainbow surface shows the slice of the
 * shared gradient under its document position, and scrolling reveals new
 * colours instead of dragging the same slice along with the viewport.
 *
 * Updates are batched into a single rAF frame so scroll stays cheap.
 */
export default function RainbowScrollSync() {
  useEffect(() => {
    const root = document.documentElement;
    let frame = 0;

    const write = () => {
      frame = 0;
      root.style.setProperty("--scroll-x", `${window.scrollX}px`);
      root.style.setProperty("--scroll-y", `${window.scrollY}px`);
    };

    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(write);
    };

    write();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      root.style.removeProperty("--scroll-x");
      root.style.removeProperty("--scroll-y");
    };
  }, []);

  return null;
}
