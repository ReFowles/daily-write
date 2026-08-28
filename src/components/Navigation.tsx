import Link from "next/link";
import Image from "next/image";
import ThemeToggle from "./ThemeToggle";
import iconSvg from "../app/icon.svg";
import { themeClasses } from "@/lib/theme-utils";
import { cn } from "@/lib/class-utils";
import { auth } from "@/lib/auth";
import SignInButton from "./SignInButton";
import SignOutButton from "./SignOutButton";
import NavLinks from "./NavLinks";
import { MobileNavMenu } from "./MobileNavMenu";
import { NavShortcuts } from "./NavShortcuts";

export default async function Navigation() {
  const session = await auth();
  const authButton = session ? <SignOutButton /> : <SignInButton />;

  return (
    <nav
      className={cn(
        "fixed inset-x-0 top-0 z-40 border-b",
        themeClasses.border.navBar,
        themeClasses.background.navBar
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center gap-2">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <Image
              src={iconSvg}
              alt="DailyWrite logo"
              width={32}
              height={32}
              className="h-8 w-8"
            />
            <span
              className={cn(
                "hidden text-xl font-bold sm:inline",
                themeClasses.text.link
              )}
            >
              DailyWrite
            </span>
          </Link>

          {/* Shortcut buttons: centered when the mobile menu is active, inline with logo on lg+ */}
          {session && (
            <div className="flex flex-1 items-center justify-center lg:flex-none lg:justify-start">
              <NavShortcuts />
            </div>
          )}

          <div className="ml-auto flex items-center gap-2">
            {/* Desktop-only nav links + theme + auth */}
            <div className="hidden items-center gap-2 lg:flex">
              <NavLinks />
              <ThemeToggle />
              {authButton}
            </div>

            {/* Mobile hamburger + collapsible panel */}
            <MobileNavMenu>
              <NavLinks orientation="vertical" />
              <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3 border-inherit">
                <ThemeToggle align="left" />
                {authButton}
              </div>
            </MobileNavMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
