import { describe, expect, it } from 'vitest';
import { contentToGoogleDocsRequests } from './content-to-google-docs';
import type { DocumentContent } from './document-content';

function doc(...content: DocumentContent['content']): DocumentContent {
  return { type: 'doc', content };
}

describe('contentToGoogleDocsRequests', () => {
  it('emits no insertText for an empty document', () => {
    const result = contentToGoogleDocsRequests(doc({ type: 'paragraph' }));
    expect(result.plainText).toBe('\n');
    expect(result.requests[0]).toEqual({
      insertText: { location: { index: 1 }, text: '\n' },
    });
  });

  it('inserts plain paragraphs with newlines', () => {
    const result = contentToGoogleDocsRequests(
      doc(
        { type: 'paragraph', content: [{ type: 'text', text: 'hello' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'world' }] }
      )
    );
    expect(result.plainText).toBe('hello\nworld\n');
    expect(result.requests[0]).toEqual({
      insertText: { location: { index: 1 }, text: 'hello\nworld\n' },
    });
  });

  it('preserves literal markdown characters verbatim', () => {
    const result = contentToGoogleDocsRequests(
      doc({
        type: 'paragraph',
        content: [{ type: 'text', text: '*not italic* and _not italic_ and # not heading' }],
      })
    );
    expect(result.plainText).toBe('*not italic* and _not italic_ and # not heading\n');
    const insert = result.requests[0] as { insertText: { text: string } };
    expect(insert.insertText.text).toBe('*not italic* and _not italic_ and # not heading\n');
  });

  it('emits updateTextStyle requests for mark ranges', () => {
    const result = contentToGoogleDocsRequests(
      doc({
        type: 'paragraph',
        content: [
          { type: 'text', text: 'plain ' },
          { type: 'text', text: 'bold', marks: [{ type: 'bold' }] },
          { type: 'text', text: ' end' },
        ],
      })
    );
    expect(result.plainText).toBe('plain bold end\n');
    const styleRequest = result.requests.find(
      (r): r is { updateTextStyle: { range: { startIndex: number; endIndex: number }; fields: string } } =>
        'updateTextStyle' in (r as object) &&
        (r as { updateTextStyle: { fields: string } }).updateTextStyle.fields === 'bold'
    );
    expect(styleRequest).toBeDefined();
    expect(styleRequest!.updateTextStyle.range).toEqual({ startIndex: 7, endIndex: 11 });
    expect(styleRequest!.updateTextStyle.fields).toBe('bold');
  });

  it('handles bold across a trailing space cleanly', () => {
    const result = contentToGoogleDocsRequests(
      doc({
        type: 'paragraph',
        content: [
          { type: 'text', text: 'a ', marks: [{ type: 'bold' }] },
          { type: 'text', text: 'b' },
        ],
      })
    );
    expect(result.plainText).toBe('a b\n');
    const insert = result.requests[0] as { insertText: { text: string } };
    expect(insert.insertText.text).toBe('a b\n');
    const style = result.requests.find(
      (r): r is { updateTextStyle: { range: { startIndex: number; endIndex: number }; fields: string } } =>
        'updateTextStyle' in (r as object) &&
        (r as { updateTextStyle: { fields: string } }).updateTextStyle.fields === 'bold'
    );
    expect(style?.updateTextStyle.range).toEqual({ startIndex: 1, endIndex: 3 });
  });

  it('emits link mark as a link textStyle', () => {
    const result = contentToGoogleDocsRequests(
      doc({
        type: 'paragraph',
        content: [
          { type: 'text', text: 'go', marks: [{ type: 'link', attrs: { href: 'https://example.com' } }] },
        ],
      })
    );
    const style = result.requests.find(
      (r): r is { updateTextStyle: { textStyle: { link: { url: string } }; fields: string } } =>
        'updateTextStyle' in (r as object) &&
        (r as { updateTextStyle: { fields: string } }).updateTextStyle.fields === 'link'
    );
    expect(style?.updateTextStyle.textStyle.link).toEqual({ url: 'https://example.com' });
    expect(style?.updateTextStyle.fields).toBe('link');
  });

  it('emits updateParagraphStyle for headings', () => {
    const result = contentToGoogleDocsRequests(
      doc(
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Title' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Subtitle' }] }
      )
    );
    expect(result.plainText).toBe('Title\nSubtitle\n');
    const styles = result.requests.filter(
      (r): r is { updateParagraphStyle: { paragraphStyle: { namedStyleType: string }; range: { startIndex: number; endIndex: number } } } =>
        'updateParagraphStyle' in (r as object) &&
        (r as { updateParagraphStyle: { paragraphStyle: { namedStyleType: string } } })
          .updateParagraphStyle.paragraphStyle.namedStyleType !== 'NORMAL_TEXT'
    );
    expect(styles).toHaveLength(2);
    expect(styles[0].updateParagraphStyle.paragraphStyle.namedStyleType).toBe('HEADING_1');
    expect(styles[0].updateParagraphStyle.range).toEqual({ startIndex: 1, endIndex: 6 });
    expect(styles[1].updateParagraphStyle.paragraphStyle.namedStyleType).toBe('HEADING_2');
    expect(styles[1].updateParagraphStyle.range).toEqual({ startIndex: 7, endIndex: 15 });
  });

  it('emits createParagraphBullets for a bullet list', () => {
    const result = contentToGoogleDocsRequests(
      doc({
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
      })
    );
    expect(result.plainText).toBe('one\ntwo\n');
    const bullets = result.requests.find(
      (r): r is { createParagraphBullets: { bulletPreset: string; range: { startIndex: number; endIndex: number } } } =>
        'createParagraphBullets' in (r as object)
    );
    expect(bullets?.createParagraphBullets.bulletPreset).toBe('BULLET_DISC_CIRCLE_SQUARE');
    expect(bullets?.createParagraphBullets.range).toEqual({ startIndex: 1, endIndex: 8 });
  });

  it('uses ordered bullet preset for orderedList', () => {
    const result = contentToGoogleDocsRequests(
      doc({
        type: 'orderedList',
        content: [
          {
            type: 'listItem',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: 'a' }] }],
          },
        ],
      })
    );
    const bullets = result.requests.find(
      (r): r is { createParagraphBullets: { bulletPreset: string } } =>
        'createParagraphBullets' in (r as object)
    );
    expect(bullets?.createParagraphBullets.bulletPreset).toBe('NUMBERED_DECIMAL_ALPHA_ROMAN');
  });

  it('emits insertTable and records pendingTables for a table', () => {
    const result = contentToGoogleDocsRequests(
      doc(
        { type: 'paragraph', content: [{ type: 'text', text: 'before' }] },
        {
          type: 'table',
          content: [
            {
              type: 'tableRow',
              content: [
                {
                  type: 'tableCell',
                  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'a' }] }],
                },
                {
                  type: 'tableCell',
                  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'b' }] }],
                },
              ],
            },
          ],
        },
        { type: 'paragraph', content: [{ type: 'text', text: 'after' }] }
      )
    );
    expect(result.plainText).toBe('before\nafter\n');
    const insertTable = result.requests.find(
      (r): r is { insertTable: { rows: number; columns: number; location: { index: number } } } =>
        'insertTable' in (r as object)
    );
    expect(insertTable?.insertTable).toEqual({
      rows: 1,
      columns: 2,
      location: { index: 8 },
    });
    expect(result.pendingTables).toHaveLength(1);
    expect(result.pendingTables[0].rows).toBe(1);
    expect(result.pendingTables[0].cols).toBe(2);
  });

  it('inserts multiple tables in reverse position order', () => {
    const result = contentToGoogleDocsRequests(
      doc(
        {
          type: 'table',
          content: [
            {
              type: 'tableRow',
              content: [
                {
                  type: 'tableCell',
                  content: [{ type: 'paragraph', content: [{ type: 'text', text: '1' }] }],
                },
              ],
            },
          ],
        },
        { type: 'paragraph', content: [{ type: 'text', text: 'middle' }] },
        {
          type: 'table',
          content: [
            {
              type: 'tableRow',
              content: [
                {
                  type: 'tableCell',
                  content: [{ type: 'paragraph', content: [{ type: 'text', text: '2' }] }],
                },
              ],
            },
          ],
        }
      )
    );
    const inserts = result.requests.filter(
      (r): r is { insertTable: { location: { index: number } } } =>
        'insertTable' in (r as object)
    );
    expect(inserts).toHaveLength(2);
    expect(inserts[0].insertTable.location.index).toBeGreaterThan(inserts[1].insertTable.location.index);
  });

  it('resets inherited styles on the inserted range before applying marks', () => {
    const result = contentToGoogleDocsRequests(
      doc({
        type: 'paragraph',
        content: [{ type: 'text', text: 'plain' }],
      })
    );
    const clearText = result.requests.find(
      (r): r is { updateTextStyle: { range: { startIndex: number; endIndex: number }; textStyle: object; fields: string } } =>
        'updateTextStyle' in (r as object) &&
        (r as { updateTextStyle: { fields: string } }).updateTextStyle.fields ===
          'bold,italic,underline,strikethrough,link'
    );
    expect(clearText?.updateTextStyle.range).toEqual({ startIndex: 1, endIndex: 7 });
    expect(clearText?.updateTextStyle.textStyle).toEqual({});

    const resetPara = result.requests.find(
      (r): r is { updateParagraphStyle: { paragraphStyle: { namedStyleType: string } } } =>
        'updateParagraphStyle' in (r as object) &&
        (r as { updateParagraphStyle: { paragraphStyle: { namedStyleType: string } } })
          .updateParagraphStyle.paragraphStyle.namedStyleType === 'NORMAL_TEXT'
    );
    expect(resetPara).toBeDefined();

    const deleteBullets = result.requests.find(
      (r): r is { deleteParagraphBullets: { range: { startIndex: number; endIndex: number } } } =>
        'deleteParagraphBullets' in (r as object)
    );
    expect(deleteBullets?.deleteParagraphBullets.range).toEqual({ startIndex: 1, endIndex: 7 });
  });

  it('adds tabId to every location and range when provided', () => {
    const result = contentToGoogleDocsRequests(
      doc({
        type: 'heading',
        attrs: { level: 1 },
        content: [{ type: 'text', text: 'x', marks: [{ type: 'bold' }] }],
      }),
      'tab-123'
    );
    const insert = result.requests[0] as { insertText: { location: { tabId?: string } } };
    expect(insert.insertText.location.tabId).toBe('tab-123');
    const style = result.requests.find(
      (r): r is { updateTextStyle: { range: { tabId?: string } } } =>
        'updateTextStyle' in (r as object)
    );
    expect(style?.updateTextStyle.range.tabId).toBe('tab-123');
    const para = result.requests.find(
      (r): r is { updateParagraphStyle: { range: { tabId?: string } } } =>
        'updateParagraphStyle' in (r as object)
    );
    expect(para?.updateParagraphStyle.range.tabId).toBe('tab-123');
  });
});
