import { describe, expect, it } from 'vitest';
import { blockSignature, buildDocIndex } from './document-content-index';
import type { DocumentContent } from './document-content';

function doc(...content: DocumentContent['content']): DocumentContent {
  return { type: 'doc', content };
}

describe('buildDocIndex', () => {
  it('handles an empty paragraph', () => {
    const index = buildDocIndex(doc({ type: 'paragraph' }));
    expect(index.plainText).toBe('\n');
    expect(index.endIndex).toBe(index.plainText.length + 1);
    expect(index.blocks).toHaveLength(1);
    expect(index.blocks[0]).toMatchObject({
      startIndex: 1,
      endIndex: 1,
      kind: 'paragraph',
      text: '',
      runs: [],
      sourcePath: [0],
    });
  });

  it('produces sequential ranges for consecutive paragraphs', () => {
    const index = buildDocIndex(
      doc(
        { type: 'paragraph', content: [{ type: 'text', text: 'hello' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'world' }] }
      )
    );
    expect(index.plainText).toBe('hello\nworld\n');
    expect(index.endIndex).toBe(13);
    expect(index.blocks).toEqual([
      expect.objectContaining({
        startIndex: 1,
        endIndex: 6,
        kind: 'paragraph',
        text: 'hello',
        sourcePath: [0],
      }),
      expect.objectContaining({
        startIndex: 7,
        endIndex: 12,
        kind: 'paragraph',
        text: 'world',
        sourcePath: [1],
      }),
    ]);
  });

  it('records heading level and runs with marks', () => {
    const index = buildDocIndex(
      doc({
        type: 'heading',
        attrs: { level: 2 },
        content: [
          { type: 'text', text: 'Hello ' },
          { type: 'text', text: 'bold', marks: [{ type: 'bold' }] },
        ],
      })
    );
    expect(index.plainText).toBe('Hello bold\n');
    const [block] = index.blocks;
    expect(block).toMatchObject({
      kind: 'heading',
      headingLevel: 2,
      startIndex: 1,
      endIndex: 11,
      text: 'Hello bold',
    });
    expect(block.runs).toEqual([
      { startIndex: 1, endIndex: 7, marks: [], text: 'Hello ' },
      { startIndex: 7, endIndex: 11, marks: [{ type: 'bold' }], text: 'bold' },
    ]);
  });

  it('flattens list items into sibling blocks with listType', () => {
    const index = buildDocIndex(
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
    expect(index.plainText).toBe('one\ntwo\n');
    expect(index.blocks).toHaveLength(2);
    expect(index.blocks[0]).toMatchObject({
      kind: 'listItem',
      listType: 'bullet',
      text: 'one',
      sourcePath: [0, 0],
    });
    expect(index.blocks[1]).toMatchObject({
      kind: 'listItem',
      listType: 'bullet',
      text: 'two',
      sourcePath: [0, 1],
    });
  });

  it('reserves a table\'s span as anchors only when includeAnchors is set', () => {
    const table = { type: 'table' as const, attrs: { span: 4 } };
    const content = doc(
      { type: 'paragraph', content: [{ type: 'text', text: 'before' }] },
      table,
      { type: 'paragraph', content: [{ type: 'text', text: 'after' }] }
    );
    // Without anchors the table is dropped (full-replace can't recreate it).
    expect(buildDocIndex(content).plainText).toBe('before\nafter\n');
    // With anchors it occupies exactly `span` index units between the paragraphs.
    const anchored = buildDocIndex(content, { includeAnchors: true });
    expect(anchored.plainText).toBe('before\n\uFFFC\uFFFC\uFFFC\uFFFCafter\n');
    expect(anchored.blocks).toHaveLength(2);
    expect(anchored.blocks[1].startIndex).toBe(12);
  });

  it('always keeps endIndex equal to plainText length + 1', () => {
    const fixtures: DocumentContent[] = [
      doc({ type: 'paragraph' }),
      doc({ type: 'paragraph', content: [{ type: 'text', text: 'hi' }] }),
      doc(
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'H' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'body' }] }
      ),
    ];
    for (const input of fixtures) {
      const index = buildDocIndex(input);
      expect(index.endIndex).toBe(index.plainText.length + 1);
    }
  });

  it('gives every top-level block a distinct sourcePath', () => {
    const index = buildDocIndex(
      doc(
        { type: 'paragraph', content: [{ type: 'text', text: 'a' }] },
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'b' }],
        },
        { type: 'paragraph', content: [{ type: 'text', text: 'c' }] }
      )
    );
    const paths = index.blocks.map((b) => JSON.stringify(b.sourcePath));
    expect(new Set(paths).size).toBe(paths.length);
  });
});

describe('buildDocIndex with includeAnchors', () => {
  it('omits image/pageBreak positions by default', () => {
    const index = buildDocIndex(
      doc({
        type: 'paragraph',
        content: [
          { type: 'text', text: 'ab' },
          { type: 'image', attrs: { objectId: 'obj-1' } },
          { type: 'text', text: 'cd' },
        ],
      })
    );
    expect(index.plainText).toBe('abcd\n');
    expect(index.blocks[0].runs).toEqual([
      { startIndex: 1, endIndex: 3, marks: [], text: 'ab' },
      { startIndex: 3, endIndex: 5, marks: [], text: 'cd' },
    ]);
  });

  it('reserves one index unit per image and page break', () => {
    const index = buildDocIndex(
      doc({
        type: 'paragraph',
        content: [
          { type: 'text', text: 'ab' },
          { type: 'image', attrs: { objectId: 'obj-1' } },
          { type: 'text', text: 'cd' },
          { type: 'pageBreak' },
        ],
      }),
      { includeAnchors: true }
    );
    expect(index.plainText).toBe('ab\uFFFCcd\uFFFC\n');
    // The image anchor sits between the two text runs, so the second run starts
    // one unit later than it would without the anchor.
    expect(index.blocks[0].runs).toEqual([
      { startIndex: 1, endIndex: 3, marks: [], text: 'ab' },
      { startIndex: 4, endIndex: 6, marks: [], text: 'cd' },
    ]);
    expect(index.blocks[0].startIndex).toBe(1);
    expect(index.blocks[0].endIndex).toBe(7);
  });
});

describe('blockSignature', () => {
  it('matches for blocks of the same kind and modifiers regardless of text', () => {
    const a = buildDocIndex(
      doc({ type: 'paragraph', content: [{ type: 'text', text: 'foo' }] })
    ).blocks[0];
    const b = buildDocIndex(
      doc({ type: 'paragraph', content: [{ type: 'text', text: 'bar baz' }] })
    ).blocks[0];
    expect(blockSignature(a)).toBe(blockSignature(b));
  });

  it('differs when heading level changes', () => {
    const h1 = buildDocIndex(
      doc({
        type: 'heading',
        attrs: { level: 1 },
        content: [{ type: 'text', text: 'x' }],
      })
    ).blocks[0];
    const h2 = buildDocIndex(
      doc({
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: 'x' }],
      })
    ).blocks[0];
    expect(blockSignature(h1)).not.toBe(blockSignature(h2));
  });

  it('differs between bullet and ordered list items', () => {
    const bullet = buildDocIndex(
      doc({
        type: 'bulletList',
        content: [
          {
            type: 'listItem',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: 'x' }] }],
          },
        ],
      })
    ).blocks[0];
    const ordered = buildDocIndex(
      doc({
        type: 'orderedList',
        content: [
          {
            type: 'listItem',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: 'x' }] }],
          },
        ],
      })
    ).blocks[0];
    expect(blockSignature(bullet)).not.toBe(blockSignature(ordered));
  });
});
