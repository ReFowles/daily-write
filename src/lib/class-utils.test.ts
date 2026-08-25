import { describe, expect, it } from "vitest";
import { cn } from "./class-utils";

describe("cn", () => {
  it("joins string args with a single space", () => {
    expect(cn("a", "b", "c")).toBe("a b c");
  });

  it("skips falsy values", () => {
    expect(cn("a", false, null, undefined, "", 0, "b")).toBe("a b");
  });

  it("flattens one level of nested arrays", () => {
    expect(cn("a", ["b", false, "c"])).toBe("a b c");
  });

  it("returns empty string when nothing is truthy", () => {
    expect(cn(false, null, undefined, "")).toBe("");
  });
});
