import { useEffect, useRef, useState } from "react";

/**
 * Client-only state synced to `localStorage[key]`.
 *
 * On mount, the value is hydrated from localStorage (via a microtask, so no
 * synchronous setState in an effect). Subsequent updates are written back.
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
  const [value, setValue] = useState<T>(initialValue);

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
    queueMicrotask(() => setValue(parsed));
  }, [key]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, codecRef.current.serialize(value));
  }, [key, value]);

  return [value, setValue];
}

export const booleanFromLocalStorage = (raw: string): boolean | undefined =>
  raw === "true" ? true : raw === "false" ? false : undefined;
