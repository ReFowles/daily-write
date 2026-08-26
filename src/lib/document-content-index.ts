import type {
  BlockNode,
  DocStyle,
  DocumentContent,
  HeadingLevel,
  InlineNode,
  ListItemNode,
  Mark,
} from './document-content';
import { isNonEmptyDocStyle } from './document-content';

export type ParagraphKind = 'paragraph' | 'heading' | 'listItem';

export interface RunEntry {
  startIndex: number;
  endIndex: number;
  marks: Mark[];
  text: string;
}

export interface BlockIndexEntry {
  startIndex: number;
  // Index of the paragraph's trailing newline (one past the last text char).
  endIndex: number;
  kind: ParagraphKind;
  headingLevel?: HeadingLevel;
  listType?: 'bullet' | 'ordered';
  runs: RunEntry[];
  text: string;
  // Preserved Google Docs paragraphStyle fields (line spacing, indent, etc.)
  // that we don't model as first-class editor state.
  docStyle?: DocStyle;
  // Traversal path into DocumentContent.content — used by the diff planner as a
  // structural hint, not for uniqueness (list items inside a list share prefixes).
  sourcePath: number[];
}

export interface TableIndexEntry {
  insertIndex: number;
  rows: number;
  cols: number;
  // cellContents[row][col] holds the blocks that belong in that cell.
  cellContents: BlockNode[][][];
  sourcePath: number[];
}

export interface DocIndex {
  plainText: string;
  blocks: BlockIndexEntry[];
  tables: TableIndexEntry[];
  // Always equal to plainText.length + 1; kept for symmetry with Google Docs.
  endIndex: number;
}

// Walks a DocumentContent tree and produces the 1-based Google-Docs-index map
// used by both the full-document writer and the diff planner. Mirrors the
// paragraph/heading/list-flattening rules that Google Docs itself enforces on
// the insert side.
export function buildDocIndex(content: DocumentContent): DocIndex {
  const blocks: BlockIndexEntry[] = [];
  const tables: TableIndexEntry[] = [];
  let plainText = '';

  const appendBlock = (
    inlines: Array<{ text: string; marks: Mark[] }>,
    kind: ParagraphKind,
    sourcePath: number[],
    opts: {
      headingLevel?: HeadingLevel;
      listType?: 'bullet' | 'ordered';
      docStyle?: DocStyle | null;
    } = {}
  ) => {
    const startIndex = plainText.length + 1;
    const runs: RunEntry[] = [];
    let text = '';
    for (const inline of inlines) {
      if (inline.text.length === 0) continue;
      const runStart = plainText.length + 1;
      plainText += inline.text;
      text += inline.text;
      const runEnd = plainText.length + 1;
      runs.push({
        startIndex: runStart,
        endIndex: runEnd,
        marks: inline.marks,
        text: inline.text,
      });
    }
    const endIndex = plainText.length + 1;
    plainText += '\n';
    const entry: BlockIndexEntry = {
      startIndex,
      endIndex,
      kind,
      headingLevel: opts.headingLevel,
      listType: opts.listType,
      runs,
      text,
      sourcePath,
    };
    if (isNonEmptyDocStyle(opts.docStyle)) entry.docStyle = opts.docStyle;
    blocks.push(entry);
  };

  const collectInlines = (
    nodes: InlineNode[] | undefined
  ): Array<{ text: string; marks: Mark[] }> => {
    const out: Array<{ text: string; marks: Mark[] }> = [];
    for (const node of nodes ?? []) {
      if (node.type === 'text') {
        out.push({ text: node.text, marks: node.marks ?? [] });
      }
    }
    return out;
  };

  const walkListItem = (
    item: ListItemNode,
    listType: 'bullet' | 'ordered',
    sourcePath: number[]
  ) => {
    const children = item.content ?? [];
    const [first, ...rest] = children;

    if (first?.type === 'paragraph' || first?.type === 'heading') {
      appendBlock(collectInlines(first.content), 'listItem', sourcePath, {
        listType,
        docStyle: first.attrs?.docStyle,
      });
    } else {
      appendBlock([], 'listItem', sourcePath, { listType });
    }
    // Nested blocks (including nested lists) are flattened to sibling paragraphs
    // for now; nesting on the write path is a follow-up.
    walk(rest as BlockNode[], sourcePath);
  };

  const walk = (nodes: BlockNode[], parentPath: number[] = []) => {
    for (let idx = 0; idx < nodes.length; idx++) {
      const node = nodes[idx];
      const path = [...parentPath, idx];
      switch (node.type) {
        case 'paragraph':
          appendBlock(collectInlines(node.content), 'paragraph', path, {
            docStyle: node.attrs?.docStyle,
          });
          break;
        case 'heading':
          appendBlock(collectInlines(node.content), 'heading', path, {
            headingLevel: node.attrs.level,
            docStyle: node.attrs.docStyle,
          });
          break;
        case 'bulletList':
        case 'orderedList': {
          const listType = node.type === 'bulletList' ? 'bullet' : 'ordered';
          const items = node.content ?? [];
          for (let itemIdx = 0; itemIdx < items.length; itemIdx++) {
            walkListItem(items[itemIdx], listType, [...path, itemIdx]);
          }
          break;
        }
        case 'table': {
          const rows = node.content ?? [];
          const cols = rows[0]?.content?.length ?? 0;
          if (rows.length === 0 || cols === 0) break;
          tables.push({
            insertIndex: plainText.length + 1,
            rows: rows.length,
            cols,
            cellContents: rows.map((r) =>
              (r.content ?? []).map((c) => (c.content ?? []) as BlockNode[])
            ),
            sourcePath: path,
          });
          break;
        }
      }
    }
  };

  walk(content.content);

  return {
    plainText,
    blocks,
    tables,
    endIndex: plainText.length + 1,
  };
}

// Deterministic string signature used by the diff planner's LCS block
// alignment. Same signature ⇒ same block role (paragraph/heading/listItem +
// modifiers). Text hash is intentionally excluded here so callers can decide
// whether they want text-sensitive or text-insensitive alignment.
export function blockSignature(block: BlockIndexEntry): string {
  return [
    block.kind,
    block.headingLevel ?? '',
    block.listType ?? '',
  ].join('|');
}
