import { describe, expect, it } from 'vitest';
import { diffDocumentContent } from './document-content-diff';
import type { DocumentContent } from './document-content';

function doc(...content: DocumentContent['content']): DocumentContent {
  return { type: 'doc', content };
}

function assertDiff(plan: ReturnType<typeof diffDocumentContent>): {
  requests: object[];
} {
  if (plan.mode !== 'diff') {
    throw new Error(`expected mode:'diff', got mode:'${plan.mode}'`);
  }
  return { requests: plan.requests };
}

function findRequest<T extends string>(
  requests: object[],
  key: T
): Extract<object, Record<T, unknown>> | undefined {
  return requests.find((r) => key in (r as object)) as
    | Extract<object, Record<T, unknown>>
    | undefined;
}

function findAll(requests: object[], key: string): object[] {
  return requests.filter((r) => key in (r as object));
}

describe('diffDocumentContent', () => {
  it('emits no requests for identical content', () => {
    const input = doc({
      type: 'paragraph',
      content: [{ type: 'text', text: 'unchanged' }],
    });
    const plan = assertDiff(diffDocumentContent(input, input));
    expect(plan.requests).toEqual([]);
  });

  it('emits only an insertText for a pure insertion inside a paragraph', () => {
    const prev = doc({
      type: 'paragraph',
      content: [{ type: 'text', text: 'hello' }],
    });
    const next = doc({
      type: 'paragraph',
      content: [{ type: 'text', text: 'hello!' }],
    });
    const plan = assertDiff(diffDocumentContent(prev, next));
    expect(plan.requests).toHaveLength(1);
    expect(plan.requests[0]).toEqual({
      insertText: { location: { index: 6 }, text: '!' },
    });
  });

  it('emits only a deleteContentRange for a pure deletion', () => {
    const prev = doc({
      type: 'paragraph',
      content: [{ type: 'text', text: 'hello world' }],
    });
    const next = doc({
      type: 'paragraph',
      content: [{ type: 'text', text: 'hello' }],
    });
    const plan = assertDiff(diffDocumentContent(prev, next));
    expect(findAll(plan.requests, 'insertText')).toHaveLength(0);
    expect(findAll(plan.requests, 'updateTextStyle')).toHaveLength(0);
    expect(findAll(plan.requests, 'updateParagraphStyle')).toHaveLength(0);
    const deletes = findAll(plan.requests, 'deleteContentRange');
    expect(deletes.length).toBeGreaterThan(0);
    // Total deleted range must equal the number of removed characters.
    const totalDeleted = deletes.reduce((sum, r) => {
      const { startIndex, endIndex } = (r as {
        deleteContentRange: { range: { startIndex: number; endIndex: number } };
      }).deleteContentRange.range;
      return sum + (endIndex - startIndex);
    }, 0);
    expect(totalDeleted).toBe(6);
  });

  it('emits delete + insert for a mid-paragraph replacement', () => {
    const prev = doc({
      type: 'paragraph',
      content: [{ type: 'text', text: 'hello world' }],
    });
    const next = doc({
      type: 'paragraph',
      content: [{ type: 'text', text: 'hello there' }],
    });
    const plan = assertDiff(diffDocumentContent(prev, next));
    const deletes = findAll(plan.requests, 'deleteContentRange');
    const inserts = findAll(plan.requests, 'insertText');
    expect(deletes.length).toBeGreaterThan(0);
    expect(inserts.length).toBeGreaterThan(0);
    // No style ops emitted for a text-only change with unchanged marks.
    expect(findAll(plan.requests, 'updateTextStyle')).toHaveLength(0);
    expect(findAll(plan.requests, 'updateParagraphStyle')).toHaveLength(0);
  });

  it('emits text ops in descending prev-space order', () => {
    const prev = doc(
      { type: 'paragraph', content: [{ type: 'text', text: 'alpha' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'beta' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'gamma' }] }
    );
    const next = doc(
      { type: 'paragraph', content: [{ type: 'text', text: 'ALPHA' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'beta' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'GAMMA' }] }
    );
    const plan = assertDiff(diffDocumentContent(prev, next));
    const textOps = plan.requests.filter(
      (r) => 'deleteContentRange' in (r as object) || 'insertText' in (r as object)
    );
    const positions = textOps.map((op) => {
      const cast = op as {
        deleteContentRange?: { range: { startIndex: number } };
        insertText?: { location: { index: number } };
      };
      return cast.deleteContentRange?.range.startIndex ?? cast.insertText!.location.index;
    });
    // Non-increasing.
    for (let i = 1; i < positions.length; i++) {
      expect(positions[i - 1]).toBeGreaterThanOrEqual(positions[i]);
    }
  });

  it('emits only style requests when marks change without text changes', () => {
    const prev = doc({
      type: 'paragraph',
      content: [{ type: 'text', text: 'hello' }],
    });
    const next = doc({
      type: 'paragraph',
      content: [{ type: 'text', text: 'hello', marks: [{ type: 'bold' }] }],
    });
    const plan = assertDiff(diffDocumentContent(prev, next));
    expect(findAll(plan.requests, 'deleteContentRange')).toHaveLength(0);
    expect(findAll(plan.requests, 'insertText')).toHaveLength(0);
    const boldStyle = plan.requests.find(
      (r): r is { updateTextStyle: { textStyle: { bold?: boolean }; fields: string } } =>
        'updateTextStyle' in (r as object) &&
        (r as { updateTextStyle: { fields: string } }).updateTextStyle.fields === 'bold'
    );
    expect(boldStyle).toBeDefined();
    expect(boldStyle!.updateTextStyle.textStyle.bold).toBe(true);
  });

  it('emits only a heading-style update when a paragraph becomes a heading', () => {
    const prev = doc({
      type: 'paragraph',
      content: [{ type: 'text', text: 'Chapter 1' }],
    });
    const next = doc({
      type: 'heading',
      attrs: { level: 1 },
      content: [{ type: 'text', text: 'Chapter 1' }],
    });
    const plan = assertDiff(diffDocumentContent(prev, next));
    expect(findAll(plan.requests, 'deleteContentRange')).toHaveLength(0);
    expect(findAll(plan.requests, 'insertText')).toHaveLength(0);
    const headingStyle = plan.requests.find(
      (r): r is {
        updateParagraphStyle: { paragraphStyle: { namedStyleType: string } };
      } =>
        'updateParagraphStyle' in (r as object) &&
        (r as { updateParagraphStyle: { paragraphStyle: { namedStyleType: string } } })
          .updateParagraphStyle.paragraphStyle.namedStyleType === 'HEADING_1'
    );
    expect(headingStyle).toBeDefined();
  });

  it('creates bullets when a paragraph becomes a listItem', () => {
    const prev = doc({
      type: 'paragraph',
      content: [{ type: 'text', text: 'one' }],
    });
    const next = doc({
      type: 'bulletList',
      content: [
        {
          type: 'listItem',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'one' }] }],
        },
      ],
    });
    const plan = assertDiff(diffDocumentContent(prev, next));
    expect(findAll(plan.requests, 'deleteContentRange')).toHaveLength(0);
    expect(findAll(plan.requests, 'insertText')).toHaveLength(0);
    const bullets = findRequest(plan.requests, 'createParagraphBullets');
    expect(bullets).toBeDefined();
  });

  it('does not re-emit bullets when a listItem is unchanged', () => {
    const input = doc({
      type: 'bulletList',
      content: [
        {
          type: 'listItem',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'one' }] }],
        },
      ],
    });
    const plan = assertDiff(diffDocumentContent(input, input));
    expect(plan.requests).toEqual([]);
  });

  it('propagates tabId onto every emitted request', () => {
    const prev = doc({
      type: 'paragraph',
      content: [{ type: 'text', text: 'hello' }],
    });
    const next = doc({
      type: 'paragraph',
      content: [{ type: 'text', text: 'hello!', marks: [{ type: 'bold' }] }],
    });
    const plan = assertDiff(diffDocumentContent(prev, next, 'tab-9'));
    for (const request of plan.requests) {
      const cast = request as {
        insertText?: { location: { tabId?: string } };
        deleteContentRange?: { range: { tabId?: string } };
        updateTextStyle?: { range: { tabId?: string } };
        updateParagraphStyle?: { range: { tabId?: string } };
        createParagraphBullets?: { range: { tabId?: string } };
        deleteParagraphBullets?: { range: { tabId?: string } };
      };
      const tabId =
        cast.insertText?.location.tabId ??
        cast.deleteContentRange?.range.tabId ??
        cast.updateTextStyle?.range.tabId ??
        cast.updateParagraphStyle?.range.tabId ??
        cast.createParagraphBullets?.range.tabId ??
        cast.deleteParagraphBullets?.range.tabId;
      expect(tabId).toBe('tab-9');
    }
  });

  it('preserves an unchanged table (by span) when text around it is edited', () => {
    const table = { type: 'table' as const, attrs: { span: 12 } };
    const prev = doc(
      { type: 'paragraph', content: [{ type: 'text', text: 'intro' }] },
      table,
      { type: 'paragraph', content: [{ type: 'text', text: 'after' }] }
    );
    const next = doc(
      { type: 'paragraph', content: [{ type: 'text', text: 'intro!' }] },
      table,
      { type: 'paragraph', content: [{ type: 'text', text: 'after' }] }
    );
    const plan = assertDiff(diffDocumentContent(prev, next));
    // The 12 table anchors occupy indices 7..18; the edit lands before them and
    // no request may write or span that range.
    const inserts = findAll(plan.requests, 'insertText') as Array<{
      insertText: { location: { index: number }; text: string };
    }>;
    for (const ins of inserts) {
      expect(ins.insertText.text).not.toContain('\uFFFC');
    }
    expect(inserts).toEqual([{ insertText: { location: { index: 6 }, text: '!' } }]);
    expect(findAll(plan.requests, 'deleteContentRange')).toHaveLength(0);
  });

  it('falls back to replace for a table with an unknown span', () => {
    const prev = doc({ type: 'paragraph', content: [{ type: 'text', text: 'a' }] });
    const next = doc(
      { type: 'paragraph', content: [{ type: 'text', text: 'a' }] },
      { type: 'table', attrs: { span: 0 } }
    );
    const plan = diffDocumentContent(prev, next);
    expect(plan.mode).toBe('replace');
    if (plan.mode === 'replace') {
      expect(plan.reason).toBe('table span unavailable');
    }
  });


  it('handles multi-paragraph insertion at the end of the document', () => {
    const prev = doc({
      type: 'paragraph',
      content: [{ type: 'text', text: 'first' }],
    });
    const next = doc(
      { type: 'paragraph', content: [{ type: 'text', text: 'first' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'second' }] }
    );
    const plan = assertDiff(diffDocumentContent(prev, next));
    const insert = findRequest(plan.requests, 'insertText');
    expect(insert).toBeDefined();
    expect(
      (insert as unknown as { insertText: { text: string } }).insertText.text
    ).toContain('second');
  });

  it('emits no updateParagraphStyle when text edit leaves preserved docStyle intact', () => {
    const attrs = {
      docStyle: {
        lineSpacing: 150,
        indentFirstLine: { magnitude: 36, unit: 'PT' },
      },
    };
    const prev = doc({
      type: 'paragraph',
      attrs,
      content: [{ type: 'text', text: 'hello' }],
    });
    const next = doc({
      type: 'paragraph',
      attrs,
      content: [{ type: 'text', text: 'hello world' }],
    });
    const plan = assertDiff(diffDocumentContent(prev, next));
    expect(findAll(plan.requests, 'updateParagraphStyle')).toHaveLength(0);
    expect(findAll(plan.requests, 'updateTextStyle')).toHaveLength(0);
  });

  it('emits updateParagraphStyle covering the union of prev+next fields when preserved paragraph style changes', () => {
    const prev = doc({
      type: 'paragraph',
      attrs: { docStyle: { lineSpacing: 150 } },
      content: [{ type: 'text', text: 'hi' }],
    });
    const next = doc({
      type: 'paragraph',
      attrs: { docStyle: { alignment: 'CENTER' } },
      content: [{ type: 'text', text: 'hi' }],
    });
    const plan = assertDiff(diffDocumentContent(prev, next));
    const paraUpdates = findAll(plan.requests, 'updateParagraphStyle') as Array<{
      updateParagraphStyle: { paragraphStyle: Record<string, unknown>; fields: string };
    }>;
    const preserved = paraUpdates.find((r) =>
      r.updateParagraphStyle.fields.split(',').some((f) => f === 'lineSpacing' || f === 'alignment')
    );
    expect(preserved).toBeDefined();
    expect(preserved!.updateParagraphStyle.paragraphStyle).toEqual({ alignment: 'CENTER' });
    expect(preserved!.updateParagraphStyle.fields.split(',').sort()).toEqual(['alignment', 'lineSpacing']);
  });

  it('emits a paragraph docStyle update for a newly inserted paragraph', () => {
    const prev = doc({
      type: 'paragraph',
      content: [{ type: 'text', text: 'first' }],
    });
    const next = doc(
      { type: 'paragraph', content: [{ type: 'text', text: 'first' }] },
      {
        type: 'paragraph',
        attrs: { docStyle: { alignment: 'RIGHT' } },
        content: [{ type: 'text', text: 'second' }],
      }
    );
    const plan = assertDiff(diffDocumentContent(prev, next));
    const paraUpdates = findAll(plan.requests, 'updateParagraphStyle') as Array<{
      updateParagraphStyle: { paragraphStyle: Record<string, unknown>; fields: string };
    }>;
    expect(
      paraUpdates.some(
        (r) => r.updateParagraphStyle.paragraphStyle.alignment === 'RIGHT'
      )
    ).toBe(true);
  });

  it('emits updateTextStyle covering union of prev+next fields when run docStyle changes', () => {
    const prev = doc({
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'hi',
          marks: [
            {
              type: 'docStyle',
              attrs: { style: { weightedFontFamily: { fontFamily: 'Georgia' } } },
            },
          ],
        },
      ],
    });
    const next = doc({
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'hi',
          marks: [
            {
              type: 'docStyle',
              attrs: { style: { fontSize: { magnitude: 14, unit: 'PT' } } },
            },
          ],
        },
      ],
    });
    const plan = assertDiff(diffDocumentContent(prev, next));
    const textUpdates = findAll(plan.requests, 'updateTextStyle') as Array<{
      updateTextStyle: { textStyle: Record<string, unknown>; fields: string };
    }>;
    // The reset covers both fields so the removed one gets cleared.
    const resetFields = textUpdates
      .flatMap((r) => r.updateTextStyle.fields.split(','))
      .filter((f) => f === 'weightedFontFamily' || f === 'fontSize');
    expect(resetFields).toContain('weightedFontFamily');
    expect(resetFields).toContain('fontSize');
    // The reapply applies fontSize to the run.
    const reapply = textUpdates.find((r) => 'fontSize' in r.updateTextStyle.textStyle);
    expect(reapply).toBeDefined();
    expect(reapply!.updateTextStyle.textStyle).toEqual({ fontSize: { magnitude: 14, unit: 'PT' } });
  });

  it('leaves an image untouched when an unrelated paragraph is edited', () => {
    const withImage = {
      type: 'paragraph' as const,
      content: [
        { type: 'text' as const, text: 'caption' },
        { type: 'image' as const, attrs: { objectId: 'obj-1' } },
      ],
    };
    const prev = doc(withImage, {
      type: 'paragraph',
      content: [{ type: 'text', text: 'hello' }],
    });
    const next = doc(withImage, {
      type: 'paragraph',
      content: [{ type: 'text', text: 'hello!' }],
    });
    const plan = assertDiff(diffDocumentContent(prev, next));
    // Only the second paragraph's insert should be emitted; the image anchor is
    // shared context so nothing deletes or reinserts around it.
    expect(findAll(plan.requests, 'deleteContentRange')).toHaveLength(0);
    const inserts = findAll(plan.requests, 'insertText');
    expect(inserts).toHaveLength(1);
    // "caption" (7) + image anchor (1) + "\n" (1) = index 10 starts the 2nd
    // paragraph; the "!" lands after "hello" at 15, proving the anchor was counted.
    expect(inserts[0]).toEqual({
      insertText: { location: { index: 15 }, text: '!' },
    });
  });

  it('computes a delete range past an image anchor rather than into it', () => {
    const prev = doc({
      type: 'paragraph',
      content: [
        { type: 'image', attrs: { objectId: 'obj-1' } },
        { type: 'text', text: 'hello' },
      ],
    });
    const next = doc({
      type: 'paragraph',
      content: [
        { type: 'image', attrs: { objectId: 'obj-1' } },
        { type: 'text', text: 'hell' },
      ],
    });
    const plan = assertDiff(diffDocumentContent(prev, next));
    const deletes = findAll(plan.requests, 'deleteContentRange') as Array<{
      deleteContentRange: { range: { startIndex: number; endIndex: number } };
    }>;
    expect(deletes).toHaveLength(1);
    // Anchor occupies index 1; the removed "o" sits at index 6, never the image.
    expect(deletes[0].deleteContentRange.range).toEqual({ startIndex: 6, endIndex: 7 });
  });

  it('falls back to replace rather than writing an anchor for a new inline object', () => {
    const prev = doc({
      type: 'paragraph',
      content: [{ type: 'text', text: 'caption' }],
    });
    const next = doc({
      type: 'paragraph',
      content: [
        { type: 'text', text: 'caption' },
        { type: 'image', attrs: { objectId: 'obj-1' } },
      ],
    });
    const plan = diffDocumentContent(prev, next);
    expect(plan.mode).toBe('replace');
    if (plan.mode === 'replace') {
      expect(plan.reason).toBe('cannot reinsert inline object');
    }
  });

  it('rewrites text on both sides of an image without touching the anchor', () => {
    const image = { type: 'image' as const, attrs: { objectId: 'obj-1' } };
    const prev = doc({
      type: 'paragraph',
      content: [{ type: 'text', text: 'hello ' }, image, { type: 'text', text: ' world' }],
    });
    const next = doc({
      type: 'paragraph',
      content: [{ type: 'text', text: 'HELLO ' }, image, { type: 'text', text: ' WORLD' }],
    });
    const plan = assertDiff(diffDocumentContent(prev, next));
    const inserts = findAll(plan.requests, 'insertText') as Array<{
      insertText: { location: { index: number }; text: string };
    }>;
    const deletes = findAll(plan.requests, 'deleteContentRange') as Array<{
      deleteContentRange: { range: { startIndex: number; endIndex: number } };
    }>;
    // The image anchor sits at index 7; no op may write it or span it.
    for (const ins of inserts) {
      expect(ins.insertText.text).not.toContain('\uFFFC');
      expect(ins.insertText.location.index).not.toBe(7);
    }
    for (const del of deletes) {
      const { startIndex, endIndex } = del.deleteContentRange.range;
      expect(startIndex >= 7 || endIndex <= 7).toBe(true);
    }
  });

  it('keeps the diff for a large edit when the document holds an image', () => {
    const image = { type: 'image' as const, attrs: { objectId: 'obj-1' } };
    const prev = doc({
      type: 'paragraph',
      content: [image, { type: 'text', text: 'a b c d e f g h' }],
    });
    const next = doc({
      type: 'paragraph',
      content: [image, { type: 'text', text: 'A B C D E F G H' }],
    });
    // Enough scattered edits to blow the op budget; the anchor keeps us on diff.
    expect(diffDocumentContent(prev, next).mode).toBe('diff');
  });
});
