import { describe, expect, it } from 'vitest';
import { Editor } from '@tiptap/core';
import { StarterKit } from '@tiptap/starter-kit';
import {
  ImagePlaceholder,
  MediaPlaceholderGuard,
  MEDIA_GUARD_BYPASS_META,
  PageBreakPlaceholder,
  TablePlaceholder,
} from './media-placeholders';

function makeEditor(content: object) {
  return new Editor({
    extensions: [
      StarterKit,
      ImagePlaceholder,
      PageBreakPlaceholder,
      TablePlaceholder,
      MediaPlaceholderGuard,
    ],
    content,
  });
}

function countType(editor: Editor, name: string): number {
  let n = 0;
  editor.state.doc.descendants((node) => {
    if (node.type.name === name) n += 1;
  });
  return n;
}

const docWithImage = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'caption' },
        { type: 'image', attrs: { objectId: 'obj-1' } },
      ],
    },
  ],
};

describe('MediaPlaceholderGuard', () => {
  it('blocks deleting a placeholder', () => {
    const editor = makeEditor(docWithImage);
    expect(countType(editor, 'image')).toBe(1);

    editor.commands.selectAll();
    editor.commands.deleteSelection();

    expect(countType(editor, 'image')).toBe(1);
    editor.destroy();
  });

  it('blocks inserting/duplicating a placeholder', () => {
    const editor = makeEditor(docWithImage);
    editor.commands.insertContentAt(editor.state.doc.content.size - 1, {
      type: 'image',
      attrs: { objectId: 'obj-2' },
    });
    expect(countType(editor, 'image')).toBe(1);
    editor.destroy();
  });

  it('allows text edits around a placeholder', () => {
    const editor = makeEditor(docWithImage);
    editor.commands.insertContentAt(1, 'x');
    expect(countType(editor, 'image')).toBe(1);
    expect(editor.getText()).toContain('xcaption');
    editor.destroy();
  });

  it('blocks deleting a table chip', () => {
    const editor = makeEditor({
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'x' }] },
        { type: 'table', attrs: { span: 5 } },
      ],
    });
    expect(countType(editor, 'table')).toBe(1);

    editor.commands.selectAll();
    editor.commands.deleteSelection();

    expect(countType(editor, 'table')).toBe(1);
    editor.destroy();
  });

  it('lets programmatic setContent change placeholders when the bypass meta is set', () => {
    const editor = makeEditor(docWithImage);
    editor
      .chain()
      .command(({ tr }) => {
        tr.setMeta(MEDIA_GUARD_BYPASS_META, true);
        return true;
      })
      .setContent(
        { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'gone' }] }] },
        { emitUpdate: false }
      )
      .run();
    expect(countType(editor, 'image')).toBe(0);
    editor.destroy();
  });
});
