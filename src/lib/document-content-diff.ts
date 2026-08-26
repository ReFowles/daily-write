import fastDiff from 'fast-diff';
import type { DocStyle, DocumentContent, Mark } from './document-content';
import {
  buildDocIndex,
  blockSignature,
  type BlockIndexEntry,
  type RunEntry,
} from './document-content-index';
import {
  docStyleFields,
  extractRunDocStyle,
  marksToTextStyle,
  withTab,
  type PendingTable,
} from './content-to-google-docs';

export type DiffPlan =
  | { mode: 'diff'; requests: object[]; pendingTables: PendingTable[] }
  | { mode: 'replace'; reason: string };

// Bounded overhead: after this many text ops it's cheaper to full-replace.
const DIFF_OP_FALLBACK_MULTIPLIER = 4;

interface TextOp {
  prevStart: number;
  prevEnd: number;
  insertText: string;
}

export function diffDocumentContent(
  prev: DocumentContent,
  next: DocumentContent,
  tabId?: string
): DiffPlan {
  const prevIndex = buildDocIndex(prev);
  const nextIndex = buildDocIndex(next);

  // Real Google Docs indices flow through table content that buildDocIndex
  // treats as zero-width, so plainText positions can't be translated verbatim
  // when tables are present. Fall back until we ship a real-position map.
  if (prevIndex.tables.length > 0 || nextIndex.tables.length > 0) {
    return { mode: 'replace', reason: 'tables present' };
  }

  const textOps = computeTextOps(prevIndex.plainText, nextIndex.plainText);

  const opCount = textOps.length;
  const fallbackBudget = Math.max(1, nextIndex.blocks.length) * DIFF_OP_FALLBACK_MULTIPLIER;
  if (opCount > fallbackBudget) {
    return { mode: 'replace', reason: 'diff exceeds full-replace budget' };
  }

  const alignment = alignBlocks(prevIndex.blocks, nextIndex.blocks);
  const alignedNextIdx = new Map<number, number>();
  for (const pair of alignment) alignedNextIdx.set(pair.nextIdx, pair.prevIdx);

  const requests: object[] = [];

  const sortedTextOps = [...textOps].sort((a, b) => {
    if (a.prevStart !== b.prevStart) return b.prevStart - a.prevStart;
    // Deletes before inserts at the same position so inserted text lands in the
    // freed range instead of ahead of the delete.
    const aIsDelete = a.insertText.length === 0 ? 0 : 1;
    const bIsDelete = b.insertText.length === 0 ? 0 : 1;
    return aIsDelete - bIsDelete;
  });

  for (const op of sortedTextOps) {
    if (op.prevEnd > op.prevStart) {
      requests.push({
        deleteContentRange: {
          range: withTab({ startIndex: op.prevStart, endIndex: op.prevEnd }, tabId),
        },
      });
    }
    if (op.insertText.length > 0) {
      requests.push({
        insertText: withTab(
          { location: { index: op.prevStart }, text: op.insertText },
          tabId,
          'location'
        ),
      });
    }
  }

  requests.push(
    ...emitStyleRequests(prevIndex.blocks, nextIndex.blocks, alignedNextIdx, tabId)
  );

  return { mode: 'diff', requests, pendingTables: [] };
}

function computeTextOps(prevText: string, nextText: string): TextOp[] {
  const diff = fastDiff(prevText, nextText);
  const ops: TextOp[] = [];
  let prevCursor = 1;
  for (const [op, text] of diff) {
    if (op === 0) {
      prevCursor += text.length;
    } else if (op === -1) {
      ops.push({
        prevStart: prevCursor,
        prevEnd: prevCursor + text.length,
        insertText: '',
      });
      prevCursor += text.length;
    } else {
      // Attach an insert immediately following a delete into a single replace op
      // so we don't emit two entries at the same prev position.
      const last = ops[ops.length - 1];
      if (last && last.prevEnd === prevCursor && last.insertText === '') {
        last.insertText = text;
      } else {
        ops.push({
          prevStart: prevCursor,
          prevEnd: prevCursor,
          insertText: text,
        });
      }
    }
  }
  return ops;
}

interface Pair {
  prevIdx: number;
  nextIdx: number;
}

// Longest-common-subsequence pairing on block signature (kind + heading level +
// list type). Aligned pairs share role and position; whether text or marks
// changed is decided per block by the style emitter.
function alignBlocks(prev: BlockIndexEntry[], next: BlockIndexEntry[]): Pair[] {
  const prevKeys = prev.map((b) => blockSignature(b));
  const nextKeys = next.map((b) => blockSignature(b));
  const M = prevKeys.length;
  const N = nextKeys.length;
  const dp: number[][] = Array.from({ length: M + 1 }, () =>
    new Array<number>(N + 1).fill(0)
  );
  for (let i = M - 1; i >= 0; i--) {
    for (let j = N - 1; j >= 0; j--) {
      if (prevKeys[i] === nextKeys[j]) {
        dp[i][j] = dp[i + 1][j + 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }
  const pairs: Pair[] = [];
  let i = 0;
  let j = 0;
  while (i < M && j < N) {
    if (prevKeys[i] === nextKeys[j]) {
      pairs.push({ prevIdx: i, nextIdx: j });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      i++;
    } else {
      j++;
    }
  }
  return pairs;
}

function marksEqual(a: Mark[], b: Mark[]): boolean {
  if (a.length !== b.length) return false;
  const sortKey = (m: Mark) => JSON.stringify(m);
  const sortedA = [...a].map(sortKey).sort();
  const sortedB = [...b].map(sortKey).sort();
  for (let i = 0; i < sortedA.length; i++) {
    if (sortedA[i] !== sortedB[i]) return false;
  }
  return true;
}

// Whether the two blocks have the same per-run mark sequence, regardless of the
// text inside each run. When this holds, text edits inside the block don't need
// mark reset requests — Google Docs correctly inherits the surrounding run's
// style for the inserted characters.
function markStructureEqual(prevRuns: RunEntry[], nextRuns: RunEntry[]): boolean {
  if (prevRuns.length !== nextRuns.length) return false;
  for (let i = 0; i < prevRuns.length; i++) {
    if (!marksEqual(prevRuns[i].marks, nextRuns[i].marks)) return false;
  }
  return true;
}

function docStyleEqual(a: DocStyle | undefined, b: DocStyle | undefined): boolean {
  const aEmpty = !a || Object.keys(a).length === 0;
  const bEmpty = !b || Object.keys(b).length === 0;
  if (aEmpty && bEmpty) return true;
  if (aEmpty || bEmpty) return false;
  return JSON.stringify(a) === JSON.stringify(b);
}

function runDocStyleEqual(prevRuns: RunEntry[], nextRuns: RunEntry[]): boolean {
  if (prevRuns.length !== nextRuns.length) return false;
  for (let i = 0; i < prevRuns.length; i++) {
    const prevStyle = extractRunDocStyle(prevRuns[i].marks) ?? undefined;
    const nextStyle = extractRunDocStyle(nextRuns[i].marks) ?? undefined;
    if (!docStyleEqual(prevStyle, nextStyle)) return false;
  }
  return true;
}

function unionRunDocStyleFields(runs: RunEntry[]): string[] {
  const fields = new Set<string>();
  for (const run of runs) {
    const style = extractRunDocStyle(run.marks);
    if (!style) continue;
    for (const key of Object.keys(style)) fields.add(key);
  }
  return [...fields];
}

function emitStyleRequests(
  prevBlocks: BlockIndexEntry[],
  nextBlocks: BlockIndexEntry[],
  alignedNextIdx: Map<number, number>,
  tabId?: string
): object[] {
  const requests: object[] = [];

  for (let i = 0; i < nextBlocks.length; i++) {
    const block = nextBlocks[i];
    const prevIdx = alignedNextIdx.get(i);
    const prevBlock = prevIdx !== undefined ? prevBlocks[prevIdx] : undefined;
    const aligned = prevBlock !== undefined;
    const markStructurePreserved =
      aligned && markStructureEqual(prevBlock.runs, block.runs);
    const runStyleUnchanged =
      aligned && runDocStyleEqual(prevBlock.runs, block.runs);
    const paragraphStyleUnchanged =
      aligned && docStyleEqual(prevBlock.docStyle, block.docStyle);
    const hasTextRange = block.startIndex < block.endIndex;

    if (
      aligned &&
      markStructurePreserved &&
      runStyleUnchanged &&
      paragraphStyleUnchanged
    ) {
      continue;
    }

    const range = withTab(
      { startIndex: block.startIndex, endIndex: block.endIndex },
      tabId
    );

    const needsMarkReset = !aligned || !markStructurePreserved;
    const needsRunStyleReset = !aligned || !runStyleUnchanged;

    if (hasTextRange && (needsMarkReset || needsRunStyleReset)) {
      const resetFields = new Set<string>();
      if (needsMarkReset) {
        for (const field of ['bold', 'italic', 'underline', 'strikethrough', 'link']) {
          resetFields.add(field);
        }
      }
      if (needsRunStyleReset) {
        const prevRunFields = aligned ? unionRunDocStyleFields(prevBlock.runs) : [];
        const nextRunFields = unionRunDocStyleFields(block.runs);
        for (const f of prevRunFields) resetFields.add(f);
        for (const f of nextRunFields) resetFields.add(f);
      }
      if (resetFields.size > 0) {
        requests.push({
          updateTextStyle: {
            range,
            textStyle: {},
            fields: [...resetFields].join(','),
          },
        });
      }
    }

    if (!aligned) {
      // Block is structurally new — reset paragraph style + bullets so any
      // inherited state from the insertion point doesn't leak in.
      if (hasTextRange) {
        requests.push({
          updateParagraphStyle: {
            range,
            paragraphStyle: { namedStyleType: 'NORMAL_TEXT' },
            fields: 'namedStyleType',
          },
        });
        requests.push({ deleteParagraphBullets: { range } });
      }
    }

    if (hasTextRange) {
      for (const run of block.runs) {
        if (run.startIndex === run.endIndex) continue;
        const { textStyle, fields } = marksToTextStyle(run.marks);
        if (fields.length > 0) {
          requests.push({
            updateTextStyle: {
              range: withTab(
                { startIndex: run.startIndex, endIndex: run.endIndex },
                tabId
              ),
              textStyle,
              fields: fields.join(','),
            },
          });
        }
        const preservedRunStyle = extractRunDocStyle(run.marks);
        if (preservedRunStyle) {
          requests.push({
            updateTextStyle: {
              range: withTab(
                { startIndex: run.startIndex, endIndex: run.endIndex },
                tabId
              ),
              textStyle: preservedRunStyle,
              fields: docStyleFields(preservedRunStyle).join(','),
            },
          });
        }
      }
    }

    if (!paragraphStyleUnchanged || !aligned) {
      const prevParaFields = aligned && prevBlock.docStyle ? docStyleFields(prevBlock.docStyle) : [];
      const nextParaFields = block.docStyle ? docStyleFields(block.docStyle) : [];
      const paraFieldSet = new Set<string>([...prevParaFields, ...nextParaFields]);
      if (paraFieldSet.size > 0 && hasTextRange) {
        requests.push({
          updateParagraphStyle: {
            range,
            paragraphStyle: block.docStyle ?? {},
            fields: [...paraFieldSet].join(','),
          },
        });
      }
    }

    if (!aligned) {
      requests.push(...emitBlockKindRequests(block, tabId));
    }
  }

  return requests;
}

function emitBlockKindRequests(
  block: BlockIndexEntry,
  tabId?: string
): object[] {
  const requests: object[] = [];
  const range = withTab(
    {
      startIndex: block.startIndex,
      endIndex: Math.max(block.endIndex, block.startIndex + 1),
    },
    tabId
  );
  if (block.kind === 'heading' && block.headingLevel) {
    requests.push({
      updateParagraphStyle: {
        range,
        paragraphStyle: { namedStyleType: `HEADING_${block.headingLevel}` },
        fields: 'namedStyleType',
      },
    });
  }
  if (block.kind === 'listItem' && block.listType) {
    requests.push({
      createParagraphBullets: {
        range,
        bulletPreset:
          block.listType === 'ordered'
            ? 'NUMBERED_DECIMAL_ALPHA_ROMAN'
            : 'BULLET_DISC_CIRCLE_SQUARE',
      },
    });
  }
  return requests;
}
