import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  booleanFromLocalStorage,
  useLocalStorageState,
} from "./use-local-storage-state";

describe("useLocalStorageState", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers({ toFake: ["queueMicrotask"] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const boolParse = (raw: string): boolean | undefined =>
    raw === "true" ? true : raw === "false" ? false : undefined;

  it("returns the initial value when the key is missing", () => {
    const { result } = renderHook(() =>
      useLocalStorageState("missing", false, boolParse)
    );
    expect(result.current[0]).toBe(false);
  });

  it("hydrates from an existing localStorage value", async () => {
    localStorage.setItem("k", "true");
    const { result } = renderHook(() =>
      useLocalStorageState("k", false, boolParse)
    );

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(result.current[0]).toBe(true);
  });

  it("ignores stored values that parse returns undefined for", async () => {
    localStorage.setItem("k", "garbage");
    const { result } = renderHook(() =>
      useLocalStorageState("k", true, boolParse)
    );

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(result.current[0]).toBe(true);
  });

  it("writes updates back to localStorage", () => {
    const { result } = renderHook(() =>
      useLocalStorageState("k", false, boolParse)
    );

    act(() => {
      result.current[1](true);
    });

    expect(localStorage.getItem("k")).toBe("true");
    expect(result.current[0]).toBe(true);
  });

  it("uses a custom serialize when provided", () => {
    const serialize = (n: number) => `n:${n}`;
    const parse = (raw: string): number | undefined =>
      raw.startsWith("n:") ? Number(raw.slice(2)) : undefined;

    const { result } = renderHook(() =>
      useLocalStorageState("k", 0, parse, serialize)
    );

    act(() => {
      result.current[1](7);
    });

    expect(localStorage.getItem("k")).toBe("n:7");
  });
});

describe("booleanFromLocalStorage", () => {
  it("parses stringified booleans", () => {
    expect(booleanFromLocalStorage("true")).toBe(true);
    expect(booleanFromLocalStorage("false")).toBe(false);
  });

  it("returns undefined for anything else", () => {
    expect(booleanFromLocalStorage("")).toBeUndefined();
    expect(booleanFromLocalStorage("1")).toBeUndefined();
    expect(booleanFromLocalStorage("yes")).toBeUndefined();
  });
});
