"use client";

import { usePathname } from "next/navigation";
import { useFullscreenMode } from "@/lib/use-fullscreen-mode";
import { cn } from "@/lib/class-utils";

/** Hides the navbar while in fullscreen mode on the /write page. */
export default function NavigationChrome({
  navigation,
  children,
}: {
  navigation: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [fullscreenMode] = useFullscreenMode();
  const hideNav = pathname === "/write" && fullscreenMode;

  return (
    <>
      {!hideNav && navigation}
      <div className={cn(!hideNav && "pt-16")}>{children}</div>
    </>
  );
}
