import { Extension, Mark } from '@tiptap/react';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import type { Mark as PmMark, Node as PmNode } from '@tiptap/pm/model';

// Carries Google Docs paragraphStyle fields we don't render in the editor
// (line spacing, first-line indent, alignment, ...) as an opaque attribute on
// paragraph and heading nodes. `keepOnSplit` propagates the style to a new
// paragraph when the user hits Enter, matching Google Docs' behavior.
export const DocParagraphStylePassthrough = Extension.create({
  name: 'docParagraphStylePassthrough',

  addGlobalAttributes() {
    return [
      {
        types: ['paragraph', 'heading'],
        attributes: {
          docStyle: {
            default: null,
            keepOnSplit: true,
            parseHTML: () => null,
            renderHTML: () => ({}),
          },
        },
      },
    ];
  },
});

const docStylePluginKey = new PluginKey('docStyleStickyMark');

// Finds the docStyle mark on the last text node inside `paragraph`, so a fresh
// paragraph created by an Enter can inherit the font/color/etc. of whatever
// text preceded it.
function findTrailingDocStyleMark(
  paragraph: PmNode,
  markType: ReturnType<typeof getMarkType>
): PmMark | null {
  if (!markType) return null;
  let found: PmMark | null = null;
  paragraph.descendants((child) => {
    if (child.isText) {
      const mark = child.marks.find((m) => m.type === markType);
      if (mark) found = mark;
    }
    return true;
  });
  return found;
}

function getMarkType(schema: PmNode['type']['schema']) {
  return schema.marks.docStyle ?? null;
}

// Carries preserved Google Docs textStyle (font family, size, colors, ...) on
// text runs. Rendered as an unstyled span so the editor keeps its clean prose
// look while the metadata survives getJSON round-trips.
export const DocTextStyleMark = Mark.create({
  name: 'docStyle',

  addAttributes() {
    return {
      style: {
        default: null,
        parseHTML: () => null,
        renderHTML: () => ({}),
      },
    };
  },

  parseHTML() {
    return [];
  },

  renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, unknown> }) {
    return ['span', HTMLAttributes, 0];
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: docStylePluginKey,
        // After a paragraph split lands the cursor in a fresh empty block, the
        // browser drops storedMarks, so the next character loses the preserved
        // font. Re-seed storedMarks from the last docStyle mark in the block
        // above the split so typing continues in the same font.
        appendTransaction: (transactions, oldState, newState) => {
          const docChanged = transactions.some((tr) => tr.docChanged);
          if (!docChanged) return null;
          const { $from } = newState.selection;
          if (!newState.selection.empty) return null;
          const parent = $from.parent;
          if (parent.type.name !== 'paragraph' && parent.type.name !== 'heading') {
            return null;
          }
          if (parent.content.size !== 0) return null;
          if (newState.storedMarks && newState.storedMarks.length > 0) return null;
          const posBeforeBlock = $from.before();
          if (posBeforeBlock <= 0) return null;
          const prevBlock = newState.doc.resolve(posBeforeBlock).nodeBefore;
          if (!prevBlock) return null;
          const markType = getMarkType(newState.schema);
          const trailing = findTrailingDocStyleMark(prevBlock, markType);
          if (!trailing) return null;
          return newState.tr.setStoredMarks([trailing]);
        },
      }),
    ];
  },
});
