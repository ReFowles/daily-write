import { describe, expect, it } from 'vitest';
import { contentToGoogleDocsRequests } from './content-to-google-docs';
import { diffDocumentContent } from './document-content-diff';
import { googleDocsToContent, type GoogleDocsDocument } from './google-docs-to-content';
import type { DocumentContent } from './document-content';

// Minimal in-memory simulator of the subset of Google Docs batchUpdate
// requests emitted by contentToGoogleDocsRequests. Not a general applier — it
// only covers paragraphs, headings, text-style marks, and bullet lists. Table
// requests are asserted at the request-shape level instead (real cell writes
// require a second-batch round trip that isn't exercised here).

interface DocsTextStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  link?: { url?: string | null } | null;
}

interface SimParagraph {
  text: string;
  styles: DocsTextStyle[];
  paragraphStyle: { namedStyleType?: string };
  bullet?: { listId: string; nestingLevel: number };
}

function locateChar(
  paragraphs: SimParagraph[],
  index: number
): { paragraphIndex: number; charIndex: number; isNewline: boolean } {
  let offset = 1;
  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i];
    const paraLength = p.text.length + 1; // +1 for trailing newline
    if (index < offset + paraLength) {
      const localIndex = index - offset;
      return {
        paragraphIndex: i,
        charIndex: localIndex,
        isNewline: localIndex === p.text.length,
      };
    }
    offset += paraLength;
  }
  const last = paragraphs.length - 1;
  return {
    paragraphIndex: last,
    charIndex: paragraphs[last].text.length,
    isNewline: true,
  };
}

interface SimResult {
  paragraphs: SimParagraph[];
  lists: Record<string, { listProperties: { nestingLevels: Array<{ glyphType?: string; glyphSymbol?: string }> } }>;
}

function freshSim(): SimState {
  return {
    paragraphs: [{ text: '', styles: [], paragraphStyle: {} }],
    lists: {},
    nextListSeq: 0,
  };
}

interface SimState {
  paragraphs: SimParagraph[];
  lists: SimResult['lists'];
  nextListSeq: number;
}

function applyRequests(state: SimState, requests: object[]): void {
  const { paragraphs, lists } = state;

  for (const request of requests) {
    if ('insertText' in request) {
      const { location, text } = (request as {
        insertText: { location: { index: number }; text: string };
      }).insertText;
      const { paragraphIndex, charIndex } = locateChar(paragraphs, location.index);

      const active = paragraphs[paragraphIndex];
      const before = active.text.slice(0, charIndex);
      const beforeStyles = active.styles.slice(0, charIndex);
      const after = active.text.slice(charIndex);
      const afterStyles = active.styles.slice(charIndex);

      const pieces = text.split('\n');
      const newParagraphs: SimParagraph[] = [];
      for (let i = 0; i < pieces.length; i++) {
        const isFirst = i === 0;
        const isLast = i === pieces.length - 1;
        const piece = pieces[i];
        const styles = piece.split('').map(() => ({}));
        newParagraphs.push({
          text: (isFirst ? before : '') + piece + (isLast ? after : ''),
          styles: [
            ...(isFirst ? beforeStyles : []),
            ...styles,
            ...(isLast ? afterStyles : []),
          ],
          paragraphStyle: isFirst || isLast ? { ...active.paragraphStyle } : {},
          bullet: isFirst || isLast ? active.bullet : undefined,
        });
      }
      paragraphs.splice(paragraphIndex, 1, ...newParagraphs);
      continue;
    }

    if ('deleteContentRange' in request) {
      const { range } = (request as {
        deleteContentRange: { range: { startIndex: number; endIndex: number } };
      }).deleteContentRange;

      let remaining = range.endIndex - range.startIndex;
      while (remaining > 0) {
        const start = locateChar(paragraphs, range.startIndex);
        const active = paragraphs[start.paragraphIndex];
        const paraChars = active.text.length + 1; // +1 for trailing newline
        const availableInPara = paraChars - start.charIndex;
        const take = Math.min(remaining, availableInPara);

        if (start.charIndex + take <= active.text.length) {
          // Straight in-paragraph deletion.
          active.text = active.text.slice(0, start.charIndex) + active.text.slice(start.charIndex + take);
          active.styles = [
            ...active.styles.slice(0, start.charIndex),
            ...active.styles.slice(start.charIndex + take),
          ];
        } else {
          // Deletion consumes the trailing newline; merge with next paragraph.
          const keptText = active.text.slice(0, start.charIndex);
          const keptStyles = active.styles.slice(0, start.charIndex);
          const next = paragraphs[start.paragraphIndex + 1];
          if (next) {
            active.text = keptText + next.text;
            active.styles = [...keptStyles, ...next.styles];
            active.paragraphStyle = { ...next.paragraphStyle };
            active.bullet = next.bullet;
            paragraphs.splice(start.paragraphIndex + 1, 1);
          } else {
            active.text = keptText;
            active.styles = keptStyles;
          }
        }
        remaining -= take;
      }
      continue;
    }

    if ('updateTextStyle' in request) {
      const { range, textStyle, fields } = (request as {
        updateTextStyle: {
          range: { startIndex: number; endIndex: number };
          textStyle: Record<string, unknown>;
          fields: string;
        };
      }).updateTextStyle;
      const fieldList = fields.split(',').map((f) => f.trim()).filter(Boolean);
      for (let idx = range.startIndex; idx < range.endIndex; idx++) {
        const { paragraphIndex, charIndex, isNewline } = locateChar(paragraphs, idx);
        if (isNewline) continue;
        const target = paragraphs[paragraphIndex].styles[charIndex];
        for (const field of fieldList) {
          const value = textStyle[field];
          if (value === undefined) {
            delete (target as Record<string, unknown>)[field];
          } else {
            (target as Record<string, unknown>)[field] = value;
          }
        }
      }
      continue;
    }

    if ('updateParagraphStyle' in request) {
      const { range, paragraphStyle } = (request as {
        updateParagraphStyle: {
          range: { startIndex: number; endIndex: number };
          paragraphStyle: { namedStyleType?: string };
        };
      }).updateParagraphStyle;
      const start = locateChar(paragraphs, range.startIndex).paragraphIndex;
      const end = locateChar(paragraphs, Math.max(range.endIndex - 1, range.startIndex)).paragraphIndex;
      for (let i = start; i <= end; i++) {
        paragraphs[i].paragraphStyle = { ...paragraphs[i].paragraphStyle, ...paragraphStyle };
      }
      continue;
    }

    if ('createParagraphBullets' in request) {
      const { range, bulletPreset } = (request as {
        createParagraphBullets: {
          range: { startIndex: number; endIndex: number };
          bulletPreset: string;
        };
      }).createParagraphBullets;
      const listId = `L${++state.nextListSeq}`;
      const isOrdered = bulletPreset.startsWith('NUMBERED');
      lists[listId] = {
        listProperties: {
          nestingLevels: [
            isOrdered ? { glyphType: 'DECIMAL' } : { glyphSymbol: '●' },
          ],
        },
      };
      const start = locateChar(paragraphs, range.startIndex).paragraphIndex;
      const end = locateChar(paragraphs, Math.max(range.endIndex - 1, range.startIndex)).paragraphIndex;
      for (let i = start; i <= end; i++) {
        paragraphs[i].bullet = { listId, nestingLevel: 0 };
      }
      continue;
    }

    if ('deleteParagraphBullets' in request) {
      const { range } = (request as {
        deleteParagraphBullets: { range: { startIndex: number; endIndex: number } };
      }).deleteParagraphBullets;
      const start = locateChar(paragraphs, range.startIndex).paragraphIndex;
      const end = locateChar(paragraphs, Math.max(range.endIndex - 1, range.startIndex)).paragraphIndex;
      for (let i = start; i <= end; i++) {
        paragraphs[i].bullet = undefined;
      }
      continue;
    }
  }
}

function simulate(requests: object[]): SimResult {
  const state = freshSim();
  applyRequests(state, requests);
  return { paragraphs: state.paragraphs, lists: state.lists };
}

function simulatedToApiShape(sim: SimResult): GoogleDocsDocument {
  const elements = sim.paragraphs.map((p) => {
    const runs: Array<{ text: string; style: DocsTextStyle }> = [];
    for (let i = 0; i < p.text.length; i++) {
      const style = p.styles[i] ?? {};
      const prev = runs[runs.length - 1];
      if (prev && JSON.stringify(prev.style) === JSON.stringify(style)) {
        prev.text += p.text[i];
      } else {
        runs.push({ text: p.text[i], style });
      }
    }
    const paragraphRuns = runs.map((r) => ({
      textRun: { content: r.text, textStyle: r.style },
    }));
    // Append the paragraph's implicit trailing newline as a final text run so
    // the reverse converter's newline-trimming logic behaves.
    paragraphRuns.push({ textRun: { content: '\n', textStyle: {} } });
    return {
      paragraph: {
        elements: paragraphRuns,
        paragraphStyle: p.paragraphStyle,
        bullet: p.bullet ?? null,
      },
    };
  });
  // Drop the trailing implicit empty paragraph that the initial doc contains
  // so the reverse converter doesn't add a phantom empty block.
  if (elements.length > 0) {
    const last = elements[elements.length - 1];
    if ((last.paragraph.elements[0]?.textRun.content ?? '') === '\n') {
      elements.pop();
    }
  }
  return {
    body: { content: elements },
    lists: sim.lists,
  };
}

function roundTrip(input: DocumentContent, tabId?: string): DocumentContent {
  const { requests } = contentToGoogleDocsRequests(input, tabId);
  const nonTableRequests = requests.filter((r) => !('insertTable' in (r as object)));
  const sim = simulate(nonTableRequests);
  const doc = simulatedToApiShape(sim);
  return googleDocsToContent(doc, tabId);
}

describe('DocumentContent round-trip through Google Docs converters', () => {
  it('preserves a single plain paragraph', () => {
    const input: DocumentContent = {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'hello world' }] },
      ],
    };
    expect(roundTrip(input)).toEqual(input);
  });

  it('preserves literal markdown characters', () => {
    const input: DocumentContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '*asterisks* _underscores_ #hash [brackets](x)' }],
        },
      ],
    };
    expect(roundTrip(input)).toEqual(input);
  });

  it('preserves headings alongside paragraphs', () => {
    const input: DocumentContent = {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Chapter 1' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Opening line.' }],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'A section' }],
        },
      ],
    };
    expect(roundTrip(input)).toEqual(input);
  });

  it('preserves bold across a trailing space', () => {
    const input: DocumentContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'a ', marks: [{ type: 'bold' }] },
            { type: 'text', text: 'b' },
          ],
        },
      ],
    };
    expect(roundTrip(input)).toEqual(input);
  });

  it('preserves overlapping marks', () => {
    const input: DocumentContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'bold', marks: [{ type: 'bold' }] },
            { type: 'text', text: '+italic', marks: [{ type: 'bold' }, { type: 'italic' }] },
            { type: 'text', text: '+under', marks: [{ type: 'bold' }, { type: 'italic' }, { type: 'underline' }] },
          ],
        },
      ],
    };
    expect(roundTrip(input)).toEqual(input);
  });

  it('preserves strikethrough and links', () => {
    const input: DocumentContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'gone', marks: [{ type: 'strike' }] },
            { type: 'text', text: ' ' },
            {
              type: 'text',
              text: 'go',
              marks: [{ type: 'link', attrs: { href: 'https://example.com' } }],
            },
          ],
        },
      ],
    };
    expect(roundTrip(input)).toEqual(input);
  });

  it('preserves a bullet list', () => {
    const input: DocumentContent = {
      type: 'doc',
      content: [
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'one' }] }],
            },
            {
              type: 'listItem',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'two' }] }],
            },
          ],
        },
      ],
    };
    expect(roundTrip(input)).toEqual(input);
  });

  it('preserves an ordered list', () => {
    const input: DocumentContent = {
      type: 'doc',
      content: [
        {
          type: 'orderedList',
          content: [
            {
              type: 'listItem',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'alpha' }] }],
            },
            {
              type: 'listItem',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'beta' }] }],
            },
          ],
        },
      ],
    };
    expect(roundTrip(input)).toEqual(input);
  });

  it('addresses content by tabId', () => {
    const input: DocumentContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'inside tab' }],
        },
      ],
    };
    // The simulator produces a body-level doc; the reverse converter still
    // reads from body when the tab is missing, so we assert on the shape
    // rather than the tab traversal (that lookup is covered by
    // google-docs-to-content.test.ts).
    const requests = contentToGoogleDocsRequests(input, 'tab-1').requests;
    for (const request of requests) {
      const cast = request as { insertText?: { location: { tabId?: string } } };
      if (cast.insertText) expect(cast.insertText.location.tabId).toBe('tab-1');
    }
  });
});

function diffRoundTrip(prev: DocumentContent, next: DocumentContent): DocumentContent {
  const state = freshSim();
  const baseline = contentToGoogleDocsRequests(prev).requests.filter(
    (r) => !('insertTable' in (r as object))
  );
  applyRequests(state, baseline);

  const plan = diffDocumentContent(prev, next);
  if (plan.mode !== 'diff') {
    throw new Error(`expected mode:'diff' for round-trip, got mode:'${plan.mode}'`);
  }
  applyRequests(state, plan.requests);

  const api = simulatedToApiShape({ paragraphs: state.paragraphs, lists: state.lists });
  return googleDocsToContent(api);
}

describe('diffDocumentContent applied to a simulated Google Doc', () => {
  it('is a no-op when prev and next are equal', () => {
    const input: DocumentContent = {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'stable' }] },
      ],
    };
    expect(diffRoundTrip(input, input)).toEqual(input);
  });

  it('applies a mid-paragraph text insertion', () => {
    const prev: DocumentContent = {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'hello world' }] },
      ],
    };
    const next: DocumentContent = {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'hello brave world' }] },
      ],
    };
    expect(diffRoundTrip(prev, next)).toEqual(next);
  });

  it('applies a pure deletion', () => {
    const prev: DocumentContent = {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'hello world' }] },
      ],
    };
    const next: DocumentContent = {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'hello' }] },
      ],
    };
    expect(diffRoundTrip(prev, next)).toEqual(next);
  });

  it('applies a multi-paragraph append', () => {
    const prev: DocumentContent = {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'first' }] },
      ],
    };
    const next: DocumentContent = {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'first' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'second' }] },
      ],
    };
    expect(diffRoundTrip(prev, next)).toEqual(next);
  });

  it('applies a bold mark toggle without changing text', () => {
    const prev: DocumentContent = {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'hello' }] },
      ],
    };
    const next: DocumentContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'hello', marks: [{ type: 'bold' }] }],
        },
      ],
    };
    expect(diffRoundTrip(prev, next)).toEqual(next);
  });

  it('applies a paragraph→heading conversion', () => {
    const prev: DocumentContent = {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'Title' }] },
      ],
    };
    const next: DocumentContent = {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Title' }],
        },
      ],
    };
    expect(diffRoundTrip(prev, next)).toEqual(next);
  });

  it('applies a paragraph→bulletList conversion', () => {
    const prev: DocumentContent = {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'one' }] },
      ],
    };
    const next: DocumentContent = {
      type: 'doc',
      content: [
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                { type: 'paragraph', content: [{ type: 'text', text: 'one' }] },
              ],
            },
          ],
        },
      ],
    };
    expect(diffRoundTrip(prev, next)).toEqual(next);
  });
});
