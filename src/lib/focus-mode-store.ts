// External store for focus-mode so it can be read from both the write page
// and the root layout's navigation chrome without prop-drilling or context.
export const FOCUS_MODE_STORAGE_KEY = "daily-write:focus-mode";

type Listener = () => void;

let focusMode = false;
let hydrated = false;
const listeners = new Set<Listener>();

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  focusMode = window.localStorage.getItem(FOCUS_MODE_STORAGE_KEY) === "true";
}

export function getFocusModeSnapshot(): boolean {
  hydrate();
  return focusMode;
}

export function getFocusModeServerSnapshot(): boolean {
  return false;
}

export function setFocusMode(next: boolean | ((prev: boolean) => boolean)): void {
  hydrate();
  const value = typeof next === "function" ? next(focusMode) : next;
  if (value === focusMode) return;
  focusMode = value;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(FOCUS_MODE_STORAGE_KEY, String(focusMode));
  }
  listeners.forEach((listener) => listener());
}

export function subscribeFocusMode(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
