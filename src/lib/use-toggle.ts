import { useState } from "react";

interface ToggleReturn {
  isOpen: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
  setIsOpen: (value: boolean) => void;
}

/**
 * Custom hook for managing toggle/collapse state
 * Useful for dropdowns, collapsible sections, modals, etc.
 */
export function useToggle(initialValue = false): ToggleReturn {
  const [isOpen, setIsOpen] = useState(initialValue);

  const toggle = () => setIsOpen(!isOpen);
  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  return {
    isOpen,
    toggle,
    open,
    close,
    setIsOpen,
  };
}
