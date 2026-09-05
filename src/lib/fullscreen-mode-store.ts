// External store for fullscreen-mode so it can be read from both the write
// page and the root layout's navigation chrome without prop-drilling or context.
export const FULLSCREEN_MODE_STORAGE_KEY = "daily-write:fullscreen-mode";

type Listener = () => void;

let fullscreenMode = false;
let hydrated = false;
const listeners = new Set<Listener>();

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  fullscreenMode = window.localStorage.getItem(FULLSCREEN_MODE_STORAGE_KEY) === "true";
}

export function getFullscreenModeSnapshot(): boolean {
  hydrate();
  return fullscreenMode;
}

export function getFullscreenModeServerSnapshot(): boolean {
  return false;
}

export function setFullscreenMode(next: boolean | ((prev: boolean) => boolean)): void {
  hydrate();
  const value = typeof next === "function" ? next(fullscreenMode) : next;
  if (value === fullscreenMode) return;
  fullscreenMode = value;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(FULLSCREEN_MODE_STORAGE_KEY, String(fullscreenMode));
  }
  listeners.forEach((listener) => listener());
}

export function subscribeFullscreenMode(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
