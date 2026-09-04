"use client";

import { usePathname } from "next/navigation";
import { useFocusMode } from "@/lib/use-focus-mode";
import { cn } from "@/lib/class-utils";

/** Hides the navbar while in focus mode on the /write page. */
export default function NavigationChrome({
  navigation,
  children,
}: {
  navigation: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [focusMode] = useFocusMode();
  const hideNav = pathname === "/write" && focusMode;

  return (
    <>
      {!hideNav && navigation}
      <div className={cn(!hideNav && "pt-16")}>{children}</div>
    </>
  );
}
