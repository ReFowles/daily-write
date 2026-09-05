import { useCallback, useRef, useState } from "react";

// Shared across hook instances so switching tabs/re-rendering the picker
// doesn't re-fetch a word count we already have.
const wordCountCache = new Map<string, number>();
const inFlight = new Map<string, Promise<number>>();

async function fetchWordCount(docId: string): Promise<number> {
  const cached = wordCountCache.get(docId);
  if (cached !== undefined) return cached;

  const pending = inFlight.get(docId);
  if (pending) return pending;

  const promise = (async () => {
    const response = await fetch("/api/google-docs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "getWordCount", documentId: docId }),
    });
    if (!response.ok) throw new Error("Failed to fetch word count");
    const data = (await response.json()) as { wordCount: number };
    wordCountCache.set(docId, data.wordCount);
    return data.wordCount;
  })();

  inFlight.set(docId, promise);
  try {
    return await promise;
  } finally {
    inFlight.delete(docId);
  }
}

/**
 * Lazily fetches a Google Doc's word count once the element attached via the
 * returned ref scrolls into view. Fetching content is much slower than the
 * Drive metadata used elsewhere in the picker, so this avoids paying that
 * cost for every listed document up front. Callers must key components by
 * `docId` (e.g. `key={doc.id}`) so a doc change remounts rather than reuses
 * this hook's state.
 */
export function useDocWordCount(docId: string) {
  const [wordCount, setWordCount] = useState<number | null>(() => wordCountCache.get(docId) ?? null);
  const [error, setError] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Callback ref so we attach the observer the moment the card mounts,
  // instead of waiting on a render-triggered effect.
  const elementRef = useCallback(
    (node: HTMLElement | null) => {
      observerRef.current?.disconnect();
      observerRef.current = null;

      const cached = wordCountCache.get(docId);
      if (cached !== undefined) {
        setWordCount(cached);
        return;
      }

      if (!node || typeof IntersectionObserver === "undefined") return;

      const observer = new IntersectionObserver((entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();

        fetchWordCount(docId)
          .then((count) => setWordCount(count))
          .catch(() => setError(true));
      });

      observer.observe(node);
      observerRef.current = observer;
    },
    [docId]
  );

  return { wordCount, error, elementRef };
}
