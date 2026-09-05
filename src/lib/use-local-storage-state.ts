import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Client-only state synced to `localStorage[key]`.
 *
 * On mount, the value is hydrated from localStorage. Hydration only updates
 * React state — it never writes back — so it can't race with a later mount
 * effect and clobber a stored value with the initial default. Writes only
 * happen when the returned setter is called.
 *
 * `parse` maps the stored string to the state type; returning `undefined`
 * ignores unknown/invalid stored values and keeps the initial state.
 */
export function useLocalStorageState<T>(
  key: string,
  initialValue: T,
  parse: (raw: string) => T | undefined,
  serialize: (value: T) => string = String
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setInternalValue] = useState<T>(initialValue);

  // Callbacks captured in a ref so their identity doesn't drive effect reruns.
  const codecRef = useRef({ parse, serialize });
  useEffect(() => {
    codecRef.current = { parse, serialize };
  }, [parse, serialize]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(key);
    if (raw === null) return;
    const parsed = codecRef.current.parse(raw);
    if (parsed === undefined) return;
    setInternalValue(parsed);
  }, [key]);

  const setValue = useCallback<React.Dispatch<React.SetStateAction<T>>>(
    (next) => {
      setInternalValue((prev) => {
        const resolved =
          typeof next === "function" ? (next as (prev: T) => T)(prev) : next;
        if (typeof window !== "undefined") {
          window.localStorage.setItem(key, codecRef.current.serialize(resolved));
        }
        return resolved;
      });
    },
    [key]
  );

  return [value, setValue];
}

export const booleanFromLocalStorage = (raw: string): boolean | undefined =>
  raw === "true" ? true : raw === "false" ? false : undefined;
