import { describe, expect, it } from 'vitest';
import {
  contentsEqual,
  emptyDocument,
  getPlainText,
  isDocumentContent,
  type DocumentContent,
} from './document-content';

describe('emptyDocument', () => {
  it('returns a doc with a single empty paragraph', () => {
    expect(emptyDocument()).toEqual({
      type: 'doc',
      content: [{ type: 'paragraph' }],
    });
  });
});

describe('isDocumentContent', () => {
  it('accepts a well-formed document', () => {
    expect(isDocumentContent({ type: 'doc', content: [] })).toBe(true);
  });

  it('rejects non-objects', () => {
    expect(isDocumentContent(null)).toBe(false);
    expect(isDocumentContent('doc')).toBe(false);
    expect(isDocumentContent(undefined)).toBe(false);
  });

  it('rejects the wrong type tag', () => {
    expect(isDocumentContent({ type: 'paragraph', content: [] })).toBe(false);
  });

  it('rejects a missing content array', () => {
    expect(isDocumentContent({ type: 'doc' })).toBe(false);
  });
});

describe('getPlainText', () => {
  it('returns an empty string for null/undefined', () => {
    expect(getPlainText(null)).toBe('');
    expect(getPlainText(undefined)).toBe('');
  });

  it('joins paragraphs with newlines', () => {
    const doc: DocumentContent = {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'hello' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'world' }] },
      ],
    };
    expect(getPlainText(doc)).toBe('hello\nworld');
  });

  it('ignores marks when extracting text', () => {
    const doc: DocumentContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'plain ' },
            { type: 'text', text: 'bold', marks: [{ type: 'bold' }] },
          ],
        },
      ],
    };
    expect(getPlainText(doc)).toBe('plain bold');
  });

  it('walks headings, lists, and tables', () => {
    const doc: DocumentContent = {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Title' }],
        },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                { type: 'paragraph', content: [{ type: 'text', text: 'one' }] },
              ],
            },
            {
              type: 'listItem',
              content: [
                { type: 'paragraph', content: [{ type: 'text', text: 'two' }] },
              ],
            },
          ],
        },
        {
          type: 'table',
          content: [
            {
              type: 'tableRow',
              content: [
                {
                  type: 'tableCell',
                  content: [
                    { type: 'paragraph', content: [{ type: 'text', text: 'cell' }] },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };
    expect(getPlainText(doc)).toBe('Title\none\ntwo\ncell');
  });
});

describe('contentsEqual', () => {
  it('returns true for identical references', () => {
    const doc = emptyDocument();
    expect(contentsEqual(doc, doc)).toBe(true);
  });

  it('returns true for structurally equal documents', () => {
    const a: DocumentContent = {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'hi' }] }],
    };
    const b: DocumentContent = {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'hi' }] }],
    };
    expect(contentsEqual(a, b)).toBe(true);
  });

  it('returns false when text differs', () => {
    const a: DocumentContent = {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'hi' }] }],
    };
    const b: DocumentContent = {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'bye' }] }],
    };
    expect(contentsEqual(a, b)).toBe(false);
  });

  it('returns false when either side is null but not both', () => {
    expect(contentsEqual(null, emptyDocument())).toBe(false);
    expect(contentsEqual(emptyDocument(), null)).toBe(false);
  });

  it('returns true when both sides are null', () => {
    expect(contentsEqual(null, null)).toBe(true);
  });
});
