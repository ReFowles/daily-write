// Editor-agnostic structured document format used as the wire format between
// the API and the client. Shape is compatible with ProseMirror JSON so Tiptap
// can consume it directly, but no consumer outside the editor implementation
// file should depend on that fact.

export type Mark =
  | { type: 'bold' }
  | { type: 'italic' }
  | { type: 'strike' }
  | { type: 'underline' }
  | { type: 'link'; attrs: { href: string } };

export type HeadingLevel = 1 | 2 | 3;

export type TextNode = {
  type: 'text';
  text: string;
  marks?: Mark[];
};

export type ParagraphNode = {
  type: 'paragraph';
  content?: InlineNode[];
};

export type HeadingNode = {
  type: 'heading';
  attrs: { level: HeadingLevel };
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
  return JSON.stringify(a) === JSON.stringify(b);
}
