import { describe, expect, it } from "vitest";
import { formatWordCount } from "./format-utils";

describe("formatWordCount", () => {
  it("returns small numbers unchanged", () => {
    expect(formatWordCount(0)).toBe("0");
    expect(formatWordCount(1)).toBe("1");
    expect(formatWordCount(999)).toBe("999");
  });

  it("inserts thousands separators for larger counts", () => {
    expect(formatWordCount(1_000)).toBe("1,000");
    expect(formatWordCount(12_345)).toBe("12,345");
    expect(formatWordCount(1_234_567)).toBe("1,234,567");
  });

  it("preserves negative signs (e.g. day-card deficits)", () => {
    expect(formatWordCount(-200)).toBe("-200");
    expect(formatWordCount(-12_345)).toBe("-12,345");
  });
});
