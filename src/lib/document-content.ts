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

export type TableCellNode = {
  type: 'tableCell';
  attrs?: { colspan?: number; rowspan?: number };
  content?: BlockNode[];
};

export type TableHeaderNode = {
  type: 'tableHeader';
  attrs?: { colspan?: number; rowspan?: number };
  content?: BlockNode[];
};

export type TableRowNode = {
  type: 'tableRow';
  content?: Array<TableCellNode | TableHeaderNode>;
};

export type TableNode = {
  type: 'table';
  content?: TableRowNode[];
};

export type InlineNode = TextNode;

export type BlockNode =
  | ParagraphNode
  | HeadingNode
  | BulletListNode
  | OrderedListNode
  | TableNode;

export type ContentNode = BlockNode | InlineNode | ListItemNode | TableRowNode | TableCellNode | TableHeaderNode;

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
          for (const row of node.content ?? []) {
            for (const cell of row.content ?? []) walkBlocks(cell.content);
          }
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
      return {
        type: 'table',
        content: node.content?.map((row) => ({
          type: 'tableRow',
          content: row.content?.map((cell) =>
            cell.type === 'tableHeader'
              ? {
                  type: 'tableHeader',
                  attrs: cell.attrs,
                  content: canonicalizeBlocks(cell.content),
                }
              : {
                  type: 'tableCell',
                  attrs: cell.attrs,
                  content: canonicalizeBlocks(cell.content),
                }
          ),
        })),
      };
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
    if (node.type !== 'text') continue;
    const marks = canonicalizeMarks(node.marks);
    const next: TextNode = { type: 'text', text: node.text };
    if (marks && marks.length > 0) next.marks = marks;
    out.push(next);
  }
  return out.length > 0 ? out : undefined;
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
