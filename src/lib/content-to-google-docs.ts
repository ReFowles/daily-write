import type {
  BlockNode,
  DocumentContent,
  HeadingLevel,
  InlineNode,
  ListItemNode,
  Mark,
} from './document-content';

// Second-pass description of a table's cell content. The updater applies this
// after the initial batch by re-fetching the doc to learn each cell's real
// index (Google Docs cell indices can't be predicted reliably from the insert
// request alone).
export interface PendingTable {
  rows: number;
  cols: number;
  // cellContents[row][col] holds the blocks that belong in that cell.
  cellContents: BlockNode[][][];
}

export interface ConverterResult {
  requests: object[];
  plainText: string;
  pendingTables: PendingTable[];
}

interface ParagraphInfo {
  startIndex: number;
  endIndex: number;
  kind: 'paragraph' | 'heading' | 'listItem';
  headingLevel?: HeadingLevel;
  listType?: 'bullet' | 'ordered';
  runs: Array<{ startIndex: number; endIndex: number; marks: Mark[] }>;
}

interface TableSlot {
  insertIndex: number;
  table: PendingTable;
}

function withTab<T extends Record<string, unknown>>(
  obj: T,
  tabId: string | undefined,
  nestKey?: 'location'
): T {
  if (!tabId) return obj;
  if (nestKey && nestKey in obj) {
    const nested = obj[nestKey] as Record<string, unknown>;
    return { ...obj, [nestKey]: { ...nested, tabId } };
  }
  return { ...obj, tabId };
}

function marksToTextStyle(
  marks: Mark[]
): { textStyle: Record<string, unknown>; fields: string[] } {
  const textStyle: Record<string, unknown> = {};
  const fields: string[] = [];
  for (const mark of marks) {
    switch (mark.type) {
      case 'bold':
        textStyle.bold = true;
        fields.push('bold');
        break;
      case 'italic':
        textStyle.italic = true;
        fields.push('italic');
        break;
      case 'strike':
        textStyle.strikethrough = true;
        fields.push('strikethrough');
        break;
      case 'underline':
        textStyle.underline = true;
        fields.push('underline');
        break;
      case 'link':
        textStyle.link = { url: mark.attrs.href };
        fields.push('link');
        break;
    }
  }
  return { textStyle, fields };
}

export function contentToGoogleDocsRequests(
  content: DocumentContent,
  tabId?: string
): ConverterResult {
  const paragraphs: ParagraphInfo[] = [];
  const tableSlots: TableSlot[] = [];
  let plainText = '';

  const appendParagraph = (
    inlines: Array<{ text: string; marks: Mark[] }>,
    kind: 'paragraph' | 'heading' | 'listItem',
    opts: { headingLevel?: HeadingLevel; listType?: 'bullet' | 'ordered' } = {}
  ) => {
    const startIndex = plainText.length + 1;
    const runs: ParagraphInfo['runs'] = [];
    for (const inline of inlines) {
      if (inline.text.length === 0) continue;
      const runStart = plainText.length + 1;
      plainText += inline.text;
      const runEnd = plainText.length + 1;
      runs.push({ startIndex: runStart, endIndex: runEnd, marks: inline.marks });
    }
    const endIndex = plainText.length + 1;
    plainText += '\n';
    paragraphs.push({
      startIndex,
      endIndex,
      kind,
      headingLevel: opts.headingLevel,
      listType: opts.listType,
      runs,
    });
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

  const walkListItem = (item: ListItemNode, listType: 'bullet' | 'ordered') => {
    const children = item.content ?? [];
    const [first, ...rest] = children;

    if (first?.type === 'paragraph' || first?.type === 'heading') {
      appendParagraph(collectInlines(first.content), 'listItem', { listType });
    } else {
      appendParagraph([], 'listItem', { listType });
    }
    // Nested blocks (including nested lists) are flattened to sibling paragraphs
    // for now; nesting on the write path is a follow-up.
    walk(rest as BlockNode[]);
  };

  const walk = (nodes: BlockNode[]) => {
    for (const node of nodes) {
      switch (node.type) {
        case 'paragraph':
          appendParagraph(collectInlines(node.content), 'paragraph');
          break;
        case 'heading':
          appendParagraph(collectInlines(node.content), 'heading', {
            headingLevel: node.attrs.level,
          });
          break;
        case 'bulletList':
        case 'orderedList': {
          const listType = node.type === 'bulletList' ? 'bullet' : 'ordered';
          for (const item of node.content ?? []) walkListItem(item, listType);
          break;
        }
        case 'table': {
          const rows = node.content ?? [];
          const cols = rows[0]?.content?.length ?? 0;
          if (rows.length === 0 || cols === 0) break;
          tableSlots.push({
            insertIndex: plainText.length + 1,
            table: {
              rows: rows.length,
              cols,
              cellContents: rows.map((r) =>
                (r.content ?? []).map((c) => (c.content ?? []) as BlockNode[])
              ),
            },
          });
          break;
        }
      }
    }
  };

  walk(content.content);

  const requests: object[] = [];

  if (plainText.length > 0) {
    requests.push({
      insertText: withTab({ location: { index: 1 }, text: plainText }, tabId, 'location'),
    });

    // Reset inherited styles on the newly inserted range. Without this, Google
    // Docs will apply whatever paragraph / text style was in effect at the
    // insertion point (e.g. leftover bold from a previous save) to every
    // character we just inserted.
    const fullRange = withTab({ startIndex: 1, endIndex: plainText.length + 1 }, tabId);
    requests.push({
      updateTextStyle: {
        range: fullRange,
        textStyle: {},
        fields: 'bold,italic,underline,strikethrough,link',
      },
    });
    requests.push({
      updateParagraphStyle: {
        range: fullRange,
        paragraphStyle: { namedStyleType: 'NORMAL_TEXT' },
        fields: 'namedStyleType',
      },
    });
    requests.push({
      deleteParagraphBullets: { range: fullRange },
    });
  }

  for (const p of paragraphs) {
    for (const run of p.runs) {
      if (run.marks.length === 0) continue;
      if (run.startIndex === run.endIndex) continue;
      const { textStyle, fields } = marksToTextStyle(run.marks);
      if (fields.length === 0) continue;
      requests.push({
        updateTextStyle: {
          range: withTab({ startIndex: run.startIndex, endIndex: run.endIndex }, tabId),
          textStyle,
          fields: fields.join(','),
        },
      });
    }
  }

  for (const p of paragraphs) {
    if (p.kind === 'heading' && p.headingLevel) {
      requests.push({
        updateParagraphStyle: {
          range: withTab(
            { startIndex: p.startIndex, endIndex: Math.max(p.endIndex, p.startIndex + 1) },
            tabId
          ),
          paragraphStyle: { namedStyleType: `HEADING_${p.headingLevel}` },
          fields: 'namedStyleType',
        },
      });
    }
  }

  let i = 0;
  while (i < paragraphs.length) {
    const p = paragraphs[i];
    if (p.kind !== 'listItem' || !p.listType) {
      i++;
      continue;
    }
    const startI = i;
    const listType = p.listType;
    while (
      i < paragraphs.length &&
      paragraphs[i].kind === 'listItem' &&
      paragraphs[i].listType === listType
    ) {
      i++;
    }
    const rangeStart = paragraphs[startI].startIndex;
    const rangeEnd = Math.max(paragraphs[i - 1].endIndex, rangeStart + 1);
    requests.push({
      createParagraphBullets: {
        range: withTab({ startIndex: rangeStart, endIndex: rangeEnd }, tabId),
        bulletPreset:
          listType === 'ordered'
            ? 'NUMBERED_DECIMAL_ALPHA_ROMAN'
            : 'BULLET_DISC_CIRCLE_SQUARE',
      },
    });
  }

  const pendingTables: PendingTable[] = [];
  const orderedSlots = [...tableSlots].sort((a, b) => b.insertIndex - a.insertIndex);
  for (const slot of orderedSlots) {
    requests.push({
      insertTable: withTab(
        {
          rows: slot.table.rows,
          columns: slot.table.cols,
          location: { index: slot.insertIndex },
        },
        tabId,
        'location'
      ),
    });
  }
  for (const slot of tableSlots) pendingTables.push(slot.table);

  return { requests, plainText, pendingTables };
}
