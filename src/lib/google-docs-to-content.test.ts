import { describe, expect, it } from 'vitest';
import {
  googleDocsToContent,
  type GoogleDocsDocument,
} from './google-docs-to-content';

function paragraph(text: string, opts: {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  linkUrl?: string;
  headingLevel?: number;
  bullet?: { listId: string; nestingLevel?: number };
} = {}) {
  const namedStyleType = opts.headingLevel
    ? `HEADING_${opts.headingLevel}`
    : 'NORMAL_TEXT';
  return {
    paragraph: {
      elements: [
        {
          textRun: {
            content: `${text}\n`,
            textStyle: {
              bold: opts.bold,
              italic: opts.italic,
              underline: opts.underline,
              strikethrough: opts.strikethrough,
              link: opts.linkUrl ? { url: opts.linkUrl } : null,
            },
          },
        },
      ],
      paragraphStyle: { namedStyleType },
      bullet: opts.bullet ?? null,
    },
  };
}

describe('googleDocsToContent', () => {
  it('produces an empty paragraph for an empty document', () => {
    const doc: GoogleDocsDocument = { body: { content: [] } };
    expect(googleDocsToContent(doc)).toEqual({
      type: 'doc',
      content: [{ type: 'paragraph' }],
    });
  });

  it('maps a plain paragraph', () => {
    const doc: GoogleDocsDocument = {
      body: { content: [paragraph('Hello world')] },
    };
    expect(googleDocsToContent(doc)).toEqual({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Hello world' }],
        },
      ],
    });
  });

  it('preserves literal markdown characters without escaping', () => {
    const doc: GoogleDocsDocument = {
      body: { content: [paragraph('*not italic* and _not italic_ and # not heading')] },
    };
    const result = googleDocsToContent(doc);
    const first = result.content[0];
    expect(first.type).toBe('paragraph');
    if (first.type === 'paragraph') {
      expect(first.content?.[0]).toEqual({
        type: 'text',
        text: '*not italic* and _not italic_ and # not heading',
      });
    }
  });

  it('maps headings to level 1-3', () => {
    const doc: GoogleDocsDocument = {
      body: {
        content: [
          paragraph('Title', { headingLevel: 1 }),
          paragraph('Section', { headingLevel: 2 }),
          paragraph('Subsection', { headingLevel: 3 }),
        ],
      },
    };
    const result = googleDocsToContent(doc);
    expect(result.content).toEqual([
      { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Title' }] },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Section' }] },
      { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Subsection' }] },
    ]);
  });

  it('collapses heading levels 4-6 down to H3', () => {
    const doc: GoogleDocsDocument = {
      body: { content: [paragraph('Deep', { headingLevel: 5 })] },
    };
    const result = googleDocsToContent(doc);
    expect(result.content[0]).toMatchObject({ type: 'heading', attrs: { level: 3 } });
  });

  it('preserves marks on text runs', () => {
    const doc: GoogleDocsDocument = {
      body: {
        content: [
          {
            paragraph: {
              elements: [
                { textRun: { content: 'plain ', textStyle: {} } },
                { textRun: { content: 'bold', textStyle: { bold: true } } },
                { textRun: { content: ' ', textStyle: {} } },
                { textRun: { content: 'italic', textStyle: { italic: true } } },
                { textRun: { content: ' ', textStyle: {} } },
                { textRun: { content: 'strike', textStyle: { strikethrough: true } } },
                { textRun: { content: ' ', textStyle: {} } },
                { textRun: { content: 'under', textStyle: { underline: true } } },
                { textRun: { content: '\n', textStyle: {} } },
              ],
              paragraphStyle: { namedStyleType: 'NORMAL_TEXT' },
            },
          },
        ],
      },
    };
    const result = googleDocsToContent(doc);
    const first = result.content[0];
    expect(first).toMatchObject({ type: 'paragraph' });
    if (first.type === 'paragraph') {
      expect(first.content).toEqual([
        { type: 'text', text: 'plain ' },
        { type: 'text', text: 'bold', marks: [{ type: 'bold' }] },
        { type: 'text', text: ' ' },
        { type: 'text', text: 'italic', marks: [{ type: 'italic' }] },
        { type: 'text', text: ' ' },
        { type: 'text', text: 'strike', marks: [{ type: 'strike' }] },
        { type: 'text', text: ' ' },
        { type: 'text', text: 'under', marks: [{ type: 'underline' }] },
      ]);
    }
  });

  it('preserves links as marks', () => {
    const doc: GoogleDocsDocument = {
      body: {
        content: [paragraph('daily', { linkUrl: 'https://example.com' })],
      },
    };
    const result = googleDocsToContent(doc);
    const first = result.content[0];
    if (first.type === 'paragraph') {
      expect(first.content?.[0]).toEqual({
        type: 'text',
        text: 'daily',
        marks: [{ type: 'link', attrs: { href: 'https://example.com' } }],
      });
    }
  });

  it('groups consecutive bulleted paragraphs into a bullet list', () => {
    const doc: GoogleDocsDocument = {
      body: {
        content: [
          paragraph('one', { bullet: { listId: 'L1' } }),
          paragraph('two', { bullet: { listId: 'L1' } }),
        ],
      },
      lists: { L1: { listProperties: { nestingLevels: [{ glyphSymbol: '●' }] } } },
    };
    const result = googleDocsToContent(doc);
    expect(result.content[0]).toEqual({
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
    });
  });

  it('detects ordered lists via glyphType', () => {
    const doc: GoogleDocsDocument = {
      body: {
        content: [
          paragraph('one', { bullet: { listId: 'L1' } }),
          paragraph('two', { bullet: { listId: 'L1' } }),
        ],
      },
      lists: { L1: { listProperties: { nestingLevels: [{ glyphType: 'DECIMAL' }] } } },
    };
    const result = googleDocsToContent(doc);
    expect(result.content[0]).toMatchObject({ type: 'orderedList' });
  });

  it('nests bullet items using nestingLevel', () => {
    const doc: GoogleDocsDocument = {
      body: {
        content: [
          paragraph('parent', { bullet: { listId: 'L1', nestingLevel: 0 } }),
          paragraph('child', { bullet: { listId: 'L1', nestingLevel: 1 } }),
        ],
      },
      lists: {
        L1: {
          listProperties: {
            nestingLevels: [{ glyphSymbol: '●' }, { glyphSymbol: '○' }],
          },
        },
      },
    };
    const result = googleDocsToContent(doc);
    const list = result.content[0];
    expect(list.type).toBe('bulletList');
    if (list.type === 'bulletList') {
      const parent = list.content?.[0];
      expect(parent?.content?.[0]).toMatchObject({ type: 'paragraph' });
      expect(parent?.content?.[1]).toMatchObject({ type: 'bulletList' });
    }
  });

  it('maps a simple table', () => {
    const doc: GoogleDocsDocument = {
      body: {
        content: [
          {
            table: {
              tableRows: [
                {
                  tableCells: [
                    { content: [paragraph('r1c1')] },
                    { content: [paragraph('r1c2')] },
                  ],
                },
                {
                  tableCells: [
                    { content: [paragraph('r2c1')] },
                    { content: [paragraph('r2c2')] },
                  ],
                },
              ],
            },
          },
        ],
      },
    };
    const result = googleDocsToContent(doc);
    const table = result.content[0];
    expect(table.type).toBe('table');
    if (table.type === 'table') {
      expect(table.content?.length).toBe(2);
      expect(table.content?.[0].content?.length).toBe(2);
      expect(table.content?.[1].content?.[1].content?.[0]).toMatchObject({
        type: 'paragraph',
        content: [{ type: 'text', text: 'r2c2' }],
      });
    }
  });

  it('reads from the requested tab', () => {
    const doc: GoogleDocsDocument = {
      tabs: [
        {
          tabProperties: { tabId: 't1' },
          documentTab: { body: { content: [paragraph('first tab')] } },
        },
        {
          tabProperties: { tabId: 't2' },
          documentTab: { body: { content: [paragraph('second tab')] } },
        },
      ],
    };
    const result = googleDocsToContent(doc, 't2');
    expect(result.content[0]).toMatchObject({
      type: 'paragraph',
      content: [{ type: 'text', text: 'second tab' }],
    });
  });

  it('falls back to the first tab when tabId is omitted', () => {
    const doc: GoogleDocsDocument = {
      tabs: [
        {
          tabProperties: { tabId: 't1' },
          documentTab: { body: { content: [paragraph('first tab')] } },
        },
      ],
    };
    const result = googleDocsToContent(doc);
    expect(result.content[0]).toMatchObject({
      type: 'paragraph',
      content: [{ type: 'text', text: 'first tab' }],
    });
  });

  it('searches nested child tabs for a requested tabId', () => {
    const doc: GoogleDocsDocument = {
      tabs: [
        {
          tabProperties: { tabId: 't1' },
          documentTab: { body: { content: [paragraph('parent')] } },
          childTabs: [
            {
              tabProperties: { tabId: 't1a' },
              documentTab: { body: { content: [paragraph('child')] } },
            },
          ],
        },
      ],
    };
    const result = googleDocsToContent(doc, 't1a');
    expect(result.content[0]).toMatchObject({
      type: 'paragraph',
      content: [{ type: 'text', text: 'child' }],
    });
  });
});
