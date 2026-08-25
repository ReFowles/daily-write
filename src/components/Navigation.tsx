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

export default async function Navigation() {
  const session = await auth();

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
          <NavLinks />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {session ? <SignOutButton /> : <SignInButton />}
          </div>
        </div>
      </div>
    </nav>
  );
}
