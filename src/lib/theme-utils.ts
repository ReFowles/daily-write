/**
 * Semantic theme tokens. Each entry is a short Tailwind class that resolves
 * to a CSS variable defined in `globals.css`; per-theme values come from the
 * `.dark`, `.strawberry`, `.cherry`, … selectors in that file. Components
 * pull from this map instead of hardcoding `strawberry:*` / `sunset:*`
 * variant chains — adding a new theme is now purely a CSS change.
 */

export const themeClasses = {
  text: {
    primary: "text-fg",
    secondary: "text-fg-muted",
    tertiary: "text-fg-subtle",
    muted: "text-fg-subtle",
    label: "text-fg",
    link: "text-accent",
  },

  background: {
    card: "bg-surface",
    // `surface-page` is a helper class (see globals.css) that combines
    // background-color + optional gradient image, so gradient themes work.
    page: "surface-page",
    navBar: "surface-nav",
    overlay: "bg-surface",
  },

  border: {
    default: "border-line",
    card: "border-line",
    divider: "border-line",
    navBar: "border-line",
  },

  nav: {
    link: "rounded-md px-4 py-2 text-sm font-medium transition-colors",
    linkActive: "bg-accent-subtle text-accent-subtle-fg",
    linkInactive: "text-fg-muted hover:bg-surface-muted hover:text-fg",
  },
};
