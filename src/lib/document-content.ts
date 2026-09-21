// Editor-agnostic structured document format used as the wire format between
// the API and the client. Shape is compatible with ProseMirror JSON so Tiptap
// can consume it directly, but no consumer outside the editor implementation
// file should depend on that fact.

// Opaque bag of Google Docs style fields we don't model in the editor but want
// to preserve across a load/save round-trip (font, size, color, line spacing,
// paragraph spacing, first-line indent, alignment, etc.). Not rendered.
export type DocStyle = Record<string, unknown>;

export type Mark =
  | { type: 'bold' }
  | { type: 'italic' }
  | { type: 'strike' }
  | { type: 'underline' }
  | { type: 'link'; attrs: { href: string } }
  | { type: 'docStyle'; attrs: { style: DocStyle } };

export type HeadingLevel = 1 | 2 | 3;

export type TextNode = {
  type: 'text';
  text: string;
  marks?: Mark[];
};

// Inline atoms the editor renders as read-only placeholder chips. We don't own
// their pixels (they live in Google Docs) but we track their position so edits
// around them stay aligned and users can't silently backspace over them.
export type ImageNode = {
  type: 'image';
  attrs?: { objectId?: string | null; alt?: string | null };
};

export type PageBreakNode = {
  type: 'pageBreak';
};

export type ParagraphNode = {
  type: 'paragraph';
  attrs?: { docStyle?: DocStyle | null };
  content?: InlineNode[];
};

export type HeadingNode = {
  type: 'heading';
  attrs: { level: HeadingLevel; docStyle?: DocStyle | null };
  content?: InlineNode[];
};

export type ListItemNode = {
  type: 'listItem';
  content?: BlockNode[];
};

export type BulletListNode = {
  type: 'bulletList';
  content?: ListItemNode[];
};

export type OrderedListNode = {
  type: 'orderedList';
  attrs?: { start?: number };
  content?: ListItemNode[];
};

// Opaque placeholder for a Google Docs table. We don't model its contents; the
// editor shows a locked chip and the diff holds its position via `span`, the
// number of Google Docs index units the original table occupies.
export type TableNode = {
  type: 'table';
  attrs: { span: number };
};

export type InlineNode = TextNode | ImageNode | PageBreakNode;

export type BlockNode =
  | ParagraphNode
  | HeadingNode
  | BulletListNode
  | OrderedListNode
  | TableNode;

export type ContentNode = BlockNode | InlineNode | ListItemNode;

export interface DocumentContent {
  type: 'doc';
  content: BlockNode[];
}

export function emptyDocument(): DocumentContent {
  return { type: 'doc', content: [{ type: 'paragraph' }] };
}

export function isDocumentContent(value: unknown): value is DocumentContent {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as { type?: unknown; content?: unknown };
  return candidate.type === 'doc' && Array.isArray(candidate.content);
}

// Concatenates every text node into a single string with newlines between
// block-level nodes so callers can feed it to word-count utilities.
export function getPlainText(content: DocumentContent | null | undefined): string {
  if (!content) return '';

  const parts: string[] = [];

  const walkInline = (nodes: InlineNode[] | undefined): string => {
    if (!nodes) return '';
    let out = '';
    for (const node of nodes) {
      if (node.type === 'text') out += node.text;
    }
    return out;
  };

  const walkBlocks = (nodes: BlockNode[] | ListItemNode[] | undefined): void => {
    if (!nodes) return;
    for (const node of nodes) {
      switch (node.type) {
        case 'paragraph':
        case 'heading':
          parts.push(walkInline(node.content));
          break;
        case 'bulletList':
        case 'orderedList':
          for (const item of node.content ?? []) walkBlocks(item.content);
          break;
        case 'listItem':
          walkBlocks(node.content);
          break;
        case 'table':
          break;
      }
    }
  };

  walkBlocks(content.content);
  return parts.join('\n');
}

// Structural equality used to decide whether an auto-save is needed.
export function contentsEqual(
  a: DocumentContent | null | undefined,
  b: DocumentContent | null | undefined
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return JSON.stringify(canonicalizeContent(a)) === JSON.stringify(canonicalizeContent(b));
}

export function isNonEmptyDocStyle(value: unknown): value is DocStyle {
  return (
    !!value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.keys(value as Record<string, unknown>).length > 0
  );
}

// Drops `docStyle: null | {}` attrs and `docStyle` marks with no fields so the
// wire payload and equality comparisons stay stable when the editor emits
// default values for the passthrough attributes.
export function canonicalizeContent(content: DocumentContent): DocumentContent {
  return { type: 'doc', content: canonicalizeBlocks(content.content) };
}

function canonicalizeBlocks(nodes: BlockNode[] | undefined): BlockNode[] {
  if (!nodes) return [];
  return nodes.map(canonicalizeBlock);
}

function canonicalizeBlock(node: BlockNode): BlockNode {
  switch (node.type) {
    case 'paragraph': {
      const content = canonicalizeInlines(node.content);
      const attrs = canonicalizeParagraphAttrs(node.attrs);
      const out: ParagraphNode = { type: 'paragraph' };
      if (attrs) out.attrs = attrs;
      if (content) out.content = content;
      return out;
    }
    case 'heading': {
      const content = canonicalizeInlines(node.content);
      const preservedStyle = isNonEmptyDocStyle(node.attrs.docStyle) ? node.attrs.docStyle : null;
      const attrs: HeadingNode['attrs'] = { level: node.attrs.level };
      if (preservedStyle) attrs.docStyle = preservedStyle;
      const out: HeadingNode = { type: 'heading', attrs };
      if (content) out.content = content;
      return out;
    }
    case 'bulletList':
      return {
        type: 'bulletList',
        content: node.content?.map(canonicalizeListItem),
      };
    case 'orderedList':
      return {
        type: 'orderedList',
        attrs: node.attrs,
        content: node.content?.map(canonicalizeListItem),
      };
    case 'table':
      return { type: 'table', attrs: { span: node.attrs.span } };
  }
}

function canonicalizeListItem(item: ListItemNode): ListItemNode {
  return { type: 'listItem', content: canonicalizeBlocks(item.content) };
}

function canonicalizeParagraphAttrs(
  attrs: ParagraphNode['attrs']
): ParagraphNode['attrs'] | undefined {
  if (!attrs) return undefined;
  if (!isNonEmptyDocStyle(attrs.docStyle)) return undefined;
  return { docStyle: attrs.docStyle };
}

function canonicalizeInlines(nodes: InlineNode[] | undefined): InlineNode[] | undefined {
  if (!nodes || nodes.length === 0) return undefined;
  const out: InlineNode[] = [];
  for (const node of nodes) {
    if (node.type === 'text') {
      const marks = canonicalizeMarks(node.marks);
      const next: TextNode = { type: 'text', text: node.text };
      if (marks && marks.length > 0) next.marks = marks;
      out.push(next);
    } else if (node.type === 'image') {
      out.push(canonicalizeImage(node));
    } else if (node.type === 'pageBreak') {
      out.push({ type: 'pageBreak' });
    }
  }
  return out.length > 0 ? out : undefined;
}

// Drops attrs the editor emits at their defaults (alt/objectId: null) so the
// wire payload and equality checks stay stable across a load/edit round-trip.
function canonicalizeImage(node: ImageNode): ImageNode {
  const attrs: NonNullable<ImageNode['attrs']> = {};
  if (node.attrs?.objectId) attrs.objectId = node.attrs.objectId;
  if (node.attrs?.alt) attrs.alt = node.attrs.alt;
  return Object.keys(attrs).length > 0 ? { type: 'image', attrs } : { type: 'image' };
}

function canonicalizeMarks(marks: Mark[] | undefined): Mark[] | undefined {
  if (!marks || marks.length === 0) return undefined;
  const out: Mark[] = [];
  for (const mark of marks) {
    if (mark.type === 'docStyle') {
      if (isNonEmptyDocStyle(mark.attrs.style)) out.push(mark);
      continue;
    }
    out.push(mark);
  }
  return out;
}

interface LockedObjectCounts {
  images: number;
  pageBreaks: number;
  tables: number;
}

// Visits every placeholder host: `onInlines` for paragraph/heading content
// (images, page breaks) and `onTable` for each opaque table block, recursing
// through list items.
function forEachObjectHost(
  blocks: BlockNode[] | undefined,
  onInlines: (inlines: InlineNode[] | undefined) => void,
  onTable: () => void
): void {
  for (const node of blocks ?? []) {
    switch (node.type) {
      case 'paragraph':
      case 'heading':
        onInlines(node.content);
        break;
      case 'bulletList':
      case 'orderedList':
        for (const item of node.content ?? []) forEachObjectHost(item.content, onInlines, onTable);
        break;
      case 'table':
        onTable();
        break;
    }
  }
}

function countLockedObjects(content: DocumentContent): LockedObjectCounts {
  const counts: LockedObjectCounts = { images: 0, pageBreaks: 0, tables: 0 };
  forEachObjectHost(
    content.content,
    (inlines) => {
      for (const node of inlines ?? []) {
        if (node.type === 'image') counts.images += 1;
        else if (node.type === 'pageBreak') counts.pageBreaks += 1;
      }
    },
    () => {
      counts.tables += 1;
    }
  );
  return counts;
}

// Images, page breaks, and tables are locked in the editor, so their counts can
// only change via a fresh load. If two snapshots disagree, the editor state has
// desynced from the document and saving it would add or drop an object — the
// caller should reload instead. Returns true when the object counts match.
export function lockedObjectsMatch(a: DocumentContent, b: DocumentContent): boolean {
  const ca = countLockedObjects(a);
  const cb = countLockedObjects(b);
  return ca.images === cb.images && ca.pageBreaks === cb.pageBreaks && ca.tables === cb.tables;
}
