import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDocWordCount } from "./use-doc-word-count";

type ObserverCallback = (entries: Array<{ isIntersecting: boolean }>) => void;

let observerCallback: ObserverCallback | null = null;
const observeMock = vi.fn();
const disconnectMock = vi.fn();

class FakeIntersectionObserver {
  constructor(callback: ObserverCallback) {
    observerCallback = callback;
  }
  observe = observeMock;
  disconnect = disconnectMock;
  unobserve = vi.fn();
}

describe("useDocWordCount", () => {
  beforeEach(() => {
    vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ wordCount: 42 }),
      })
    );
    observerCallback = null;
    observeMock.mockClear();
    disconnectMock.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetches the word count only after the element intersects", () => {
    const { result } = renderHook(() => useDocWordCount("doc-1"));

    act(() => {
      result.current.elementRef(document.createElement("div"));
    });

    expect(observeMock).toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("resolves the word count from the API once visible", async () => {
    const { result } = renderHook(() => useDocWordCount("doc-2"));

    act(() => {
      result.current.elementRef(document.createElement("div"));
    });

    await act(async () => {
      observerCallback?.([{ isIntersecting: true }]);
    });

    expect(fetch).toHaveBeenCalledWith(
      "/api/google-docs",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ action: "getWordCount", documentId: "doc-2" }),
      })
    );
    expect(result.current.wordCount).toBe(42);
  });
});
