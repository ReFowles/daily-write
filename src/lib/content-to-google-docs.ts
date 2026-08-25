import type { BlockNode, DocumentContent, Mark } from './document-content';
import { buildDocIndex, type BlockIndexEntry } from './document-content-index';

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

export function withTab<T extends Record<string, unknown>>(
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

export function marksToTextStyle(
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
  const index = buildDocIndex(content);
  const { plainText, blocks, tables } = index;

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

  for (const block of blocks) {
    for (const run of block.runs) {
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

  for (const block of blocks) {
    if (block.kind === 'heading' && block.headingLevel) {
      requests.push({
        updateParagraphStyle: {
          range: withTab(
            {
              startIndex: block.startIndex,
              endIndex: Math.max(block.endIndex, block.startIndex + 1),
            },
            tabId
          ),
          paragraphStyle: { namedStyleType: `HEADING_${block.headingLevel}` },
          fields: 'namedStyleType',
        },
      });
    }
  }

  let i = 0;
  while (i < blocks.length) {
    const block = blocks[i];
    if (block.kind !== 'listItem' || !block.listType) {
      i++;
      continue;
    }
    const startI = i;
    const listType = block.listType;
    while (
      i < blocks.length &&
      blocks[i].kind === 'listItem' &&
      blocks[i].listType === listType
    ) {
      i++;
    }
    const rangeStart = blocks[startI].startIndex;
    const rangeEnd = Math.max(blocks[i - 1].endIndex, rangeStart + 1);
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
  const orderedSlots = [...tables].sort((a, b) => b.insertIndex - a.insertIndex);
  for (const slot of orderedSlots) {
    requests.push({
      insertTable: withTab(
        {
          rows: slot.rows,
          columns: slot.cols,
          location: { index: slot.insertIndex },
        },
        tabId,
        'location'
      ),
    });
  }
  for (const slot of tables) {
    pendingTables.push({
      rows: slot.rows,
      cols: slot.cols,
      cellContents: slot.cellContents,
    });
  }

  return { requests, plainText, pendingTables };
}

export type { BlockIndexEntry };
