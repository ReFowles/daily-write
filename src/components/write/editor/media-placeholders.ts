import { Extension, Node, mergeAttributes } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import type { Node as PmNode } from '@tiptap/pm/model';

// Inline, read-only chips that mark where an image or page break lives. The app
// can't render or edit the real object (it stays in Google Docs), so the chip is
// fully locked: non-selectable, non-draggable, and protected from add/remove by
// MediaPlaceholderGuard. It only exists to keep the object's position visible.
const CHIP_CLASS =
  'mx-0.5 inline-flex select-none items-center gap-1 rounded border border-fg/25 ' +
  'bg-fg/5 px-1.5 py-0.5 align-middle text-xs font-medium text-fg/70 cursor-default';

const BLOCK_CHIP_CLASS =
  'my-2 flex w-fit select-none items-center gap-1 rounded border border-fg/25 ' +
  'bg-fg/5 px-2 py-1 text-xs font-medium text-fg/70 cursor-default';

export const ImagePlaceholder = Node.create({
  name: 'image',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: false,
  draggable: false,

  addAttributes() {
    return {
      objectId: { default: null, parseHTML: () => null, renderHTML: () => ({}) },
      alt: { default: null, parseHTML: () => null, renderHTML: () => ({}) },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-placeholder="image"]' }];
  },

  renderHTML() {
    return [
      'span',
      mergeAttributes({
        'data-placeholder': 'image',
        contenteditable: 'false',
        draggable: 'false',
        class: CHIP_CLASS,
        title: 'Image — edit in Google Docs',
      }),
      '🖼 Image',
    ];
  },
});

export const PageBreakPlaceholder = Node.create({
  name: 'pageBreak',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: false,
  draggable: false,

  parseHTML() {
    return [{ tag: 'span[data-placeholder="page-break"]' }];
  },

  renderHTML() {
    return [
      'span',
      mergeAttributes({
        'data-placeholder': 'page-break',
        contenteditable: 'false',
        draggable: 'false',
        class: CHIP_CLASS,
        title: 'Page break',
      }),
      '⤵ Page break',
    ];
  },
});

export const TablePlaceholder = Node.create({
  name: 'table',
  group: 'block',
  atom: true,
  selectable: false,
  draggable: false,

  addAttributes() {
    return {
      span: { default: 0, parseHTML: () => null, renderHTML: () => ({}) },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-placeholder="table"]' }];
  },

  renderHTML() {
    return [
      'div',
      mergeAttributes({
        'data-placeholder': 'table',
        contenteditable: 'false',
        draggable: 'false',
        class: BLOCK_CHIP_CLASS,
        title: 'Table — edit in Google Docs',
      }),
      '▦ Table',
    ];
  },
});

const PROTECTED_NODE_TYPES = new Set(['image', 'pageBreak', 'table']);

// Transaction meta that whitelists a doc change (used by load/reconcile, the
// only sanctioned way to add or remove locked placeholder chips).
export const MEDIA_GUARD_BYPASS_META = 'mediaPlaceholderGuardBypass';

// Order-independent fingerprint of every placeholder in the doc. Two docs with
// the same multiset of images (by objectId), page breaks, and tables share a
// signature, so text edits around a chip pass while adding/removing one does not.
function placeholderSignature(doc: PmNode): string {
  const parts: string[] = [];
  doc.descendants((node) => {
    if (node.type.name === 'image') {
      parts.push(`image:${node.attrs.objectId ?? ''}`);
    } else if (node.type.name === 'pageBreak') {
      parts.push('pageBreak');
    } else if (node.type.name === 'table') {
      parts.push('table');
    }
  });
  return parts.sort().join('|');
}

// Rejects user transactions that would add, remove, or duplicate a placeholder,
// and cancels drags that start on one. Combined with the nodes' selectable:false
// / draggable:false, the chips can't be moved or deleted from the editor.
export const MediaPlaceholderGuard = Extension.create({
  name: 'mediaPlaceholderGuard',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('mediaPlaceholderGuard'),
        filterTransaction(transaction, state) {
          if (!transaction.docChanged) return true;
          if (transaction.getMeta(MEDIA_GUARD_BYPASS_META)) return true;
          return placeholderSignature(state.doc) === placeholderSignature(transaction.doc);
        },
        props: {
          handleDOMEvents: {
            dragstart: (_view, event) => {
              const target = event.target as HTMLElement | null;
              if (target?.closest('[data-placeholder]')) {
                event.preventDefault();
                return true;
              }
              return false;
            },
          },
        },
      }),
    ];
  },
});

export const __test = { placeholderSignature, PROTECTED_NODE_TYPES };
