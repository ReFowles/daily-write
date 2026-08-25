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
    expect(index.tables).toEqual([]);
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

  it('records table insertion index and cell contents without emitting text', () => {
    const index = buildDocIndex(
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
    expect(index.plainText).toBe('before\nafter\n');
    expect(index.tables).toHaveLength(1);
    expect(index.tables[0]).toMatchObject({
      insertIndex: 8,
      rows: 1,
      cols: 2,
      sourcePath: [1],
    });
    expect(index.tables[0].cellContents[0][0]).toEqual([
      { type: 'paragraph', content: [{ type: 'text', text: 'a' }] },
    ]);
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
