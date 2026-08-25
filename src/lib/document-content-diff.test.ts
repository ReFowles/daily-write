import { describe, expect, it } from 'vitest';
import { diffDocumentContent } from './document-content-diff';
import type { DocumentContent } from './document-content';

function doc(...content: DocumentContent['content']): DocumentContent {
  return { type: 'doc', content };
}

function assertDiff(plan: ReturnType<typeof diffDocumentContent>): {
  requests: object[];
  pendingTables: unknown;
} {
  if (plan.mode !== 'diff') {
    throw new Error(`expected mode:'diff', got mode:'${plan.mode}'`);
  }
  return { requests: plan.requests, pendingTables: plan.pendingTables };
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

  it('falls back to replace when either side contains tables', () => {
    const prev = doc({
      type: 'paragraph',
      content: [{ type: 'text', text: 'a' }],
    });
    const next = doc(
      { type: 'paragraph', content: [{ type: 'text', text: 'a' }] },
      {
        type: 'table',
        content: [
          {
            type: 'tableRow',
            content: [
              {
                type: 'tableCell',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'x' }] }],
              },
            ],
          },
        ],
      }
    );
    const plan = diffDocumentContent(prev, next);
    expect(plan.mode).toBe('replace');
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
});
