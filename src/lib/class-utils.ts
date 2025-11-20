/**
 * Utility function for conditionally joining class names
 * Similar to clsx but lightweight and tailored for this project
 */

type ClassValue = string | number | boolean | undefined | null | ClassValue[];

export function cn(...classes: ClassValue[]): string {
  return classes
    .flat()
    .filter((x) => typeof x === "string" && x.length > 0)
    .join(" ");
}
