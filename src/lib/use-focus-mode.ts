import { useSyncExternalStore } from "react";
import {
  getFocusModeServerSnapshot,
  getFocusModeSnapshot,
  setFocusMode,
  subscribeFocusMode,
} from "./focus-mode-store";

/** Focus-mode state shared between the write page and the nav chrome. */
export function useFocusMode(): [boolean, typeof setFocusMode] {
  const focusMode = useSyncExternalStore(
    subscribeFocusMode,
    getFocusModeSnapshot,
    getFocusModeServerSnapshot
  );
  return [focusMode, setFocusMode];
}
