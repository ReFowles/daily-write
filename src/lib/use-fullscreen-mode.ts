import { useSyncExternalStore } from "react";
import {
  getFullscreenModeServerSnapshot,
  getFullscreenModeSnapshot,
  setFullscreenMode,
  subscribeFullscreenMode,
} from "./fullscreen-mode-store";

/** Fullscreen-mode state shared between the write page and the nav chrome. */
export function useFullscreenMode(): [boolean, typeof setFullscreenMode] {
  const fullscreenMode = useSyncExternalStore(
    subscribeFullscreenMode,
    getFullscreenModeSnapshot,
    getFullscreenModeServerSnapshot
  );
  return [fullscreenMode, setFullscreenMode];
}
