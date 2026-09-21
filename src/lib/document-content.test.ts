import { describe, expect, it } from 'vitest';
import {
  canonicalizeContent,
  contentsEqual,
  emptyDocument,
  getPlainText,
  isDocumentContent,
  lockedObjectsMatch,
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

  it('walks headings and lists, ignoring opaque tables', () => {
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
        { type: 'table', attrs: { span: 8 } },
      ],
    };
    expect(getPlainText(doc)).toBe('Title\none\ntwo');
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

  it('treats null and missing docStyle attrs as equivalent', () => {
    const a: DocumentContent = {
      type: 'doc',
      content: [{ type: 'paragraph', attrs: { docStyle: null }, content: [{ type: 'text', text: 'hi' }] }],
    };
    const b: DocumentContent = {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'hi' }] }],
    };
    expect(contentsEqual(a, b)).toBe(true);
  });

  it('distinguishes documents whose preserved paragraph docStyle differs', () => {
    const a: DocumentContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          attrs: { docStyle: { lineSpacing: 150 } },
          content: [{ type: 'text', text: 'hi' }],
        },
      ],
    };
    const b: DocumentContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          attrs: { docStyle: { lineSpacing: 200 } },
          content: [{ type: 'text', text: 'hi' }],
        },
      ],
    };
    expect(contentsEqual(a, b)).toBe(false);
  });
});

describe('canonicalizeContent', () => {
  it('strips null and empty paragraph docStyle attrs', () => {
    const input: DocumentContent = {
      type: 'doc',
      content: [
        { type: 'paragraph', attrs: { docStyle: null }, content: [{ type: 'text', text: 'a' }] },
        { type: 'paragraph', attrs: { docStyle: {} }, content: [{ type: 'text', text: 'b' }] },
      ],
    };
    expect(canonicalizeContent(input)).toEqual({
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'a' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'b' }] },
      ],
    });
  });

  it('keeps non-empty docStyle attrs on paragraphs and headings', () => {
    const input: DocumentContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          attrs: { docStyle: { indentFirstLine: { magnitude: 36, unit: 'PT' } } },
          content: [{ type: 'text', text: 'a' }],
        },
        {
          type: 'heading',
          attrs: { level: 2, docStyle: { alignment: 'CENTER' } },
          content: [{ type: 'text', text: 'b' }],
        },
      ],
    };
    expect(canonicalizeContent(input)).toEqual(input);
  });

  it('drops empty docStyle marks and keeps non-empty ones', () => {
    const input: DocumentContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'plain', marks: [{ type: 'docStyle', attrs: { style: {} } }] },
            {
              type: 'text',
              text: 'fancy',
              marks: [
                { type: 'bold' },
                { type: 'docStyle', attrs: { style: { weightedFontFamily: { fontFamily: 'Georgia' } } } },
              ],
            },
          ],
        },
      ],
    };
    expect(canonicalizeContent(input)).toEqual({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'plain' },
            {
              type: 'text',
              text: 'fancy',
              marks: [
                { type: 'bold' },
                { type: 'docStyle', attrs: { style: { weightedFontFamily: { fontFamily: 'Georgia' } } } },
              ],
            },
          ],
        },
      ],
    });
  });

  it('preserves image and pageBreak nodes and drops their default attrs', () => {
    const input: DocumentContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'a' },
            { type: 'image', attrs: { objectId: 'obj-1', alt: null } },
            { type: 'pageBreak' },
          ],
        },
      ],
    };
    expect(canonicalizeContent(input)).toEqual({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'a' },
            { type: 'image', attrs: { objectId: 'obj-1' } },
            { type: 'pageBreak' },
          ],
        },
      ],
    });
  });

  it('drops a fully-default image attrs bag', () => {
    const input: DocumentContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'image', attrs: { objectId: null, alt: null } }],
        },
      ],
    };
    expect(canonicalizeContent(input)).toEqual({
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'image' }] }],
    });
  });
});

describe('lockedObjectsMatch', () => {
  it('is true for identical object counts', () => {
    const a: DocumentContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'a' },
            { type: 'image', attrs: { objectId: 'obj-1' } },
            { type: 'pageBreak' },
          ],
        },
        { type: 'table', attrs: { span: 10 } },
      ],
    };
    const b: DocumentContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'a-edited' },
            { type: 'image', attrs: { objectId: 'obj-1' } },
            { type: 'pageBreak' },
          ],
        },
        { type: 'table', attrs: { span: 10 } },
      ],
    };
    expect(lockedObjectsMatch(a, b)).toBe(true);
  });

  it('is true when there are no objects at all', () => {
    const a: DocumentContent = {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'a' }] }],
    };
    const b: DocumentContent = {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'ab' }] }],
    };
    expect(lockedObjectsMatch(a, b)).toBe(true);
  });

  it('is false when an image is missing', () => {
    const withImage: DocumentContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'a' }, { type: 'image', attrs: { objectId: 'obj-1' } }],
        },
      ],
    };
    const withoutImage: DocumentContent = {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'a' }] }],
    };
    expect(lockedObjectsMatch(withImage, withoutImage)).toBe(false);
  });

  it('is false when a page break or table count differs', () => {
    const one: DocumentContent = {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'pageBreak' }] },
        { type: 'table', attrs: { span: 8 } },
      ],
    };
    const two: DocumentContent = {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'pageBreak' }, { type: 'pageBreak' }] },
        { type: 'table', attrs: { span: 8 } },
      ],
    };
    expect(lockedObjectsMatch(one, two)).toBe(false);
  });
});
