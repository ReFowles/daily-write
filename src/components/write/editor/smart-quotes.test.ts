import { describe, expect, it } from 'vitest';
import { Editor } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { SmartQuotes } from './smart-quotes';

function makeEditor(enabled: boolean, initial: string = '<p></p>') {
  const element = document.createElement('div');
  document.body.appendChild(element);
  const editor = new Editor({
    element,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      SmartQuotes,
    ],
    content: initial,
  });
  editor.commands.setSmartQuotesEnabled(enabled);
  return editor;
}

// Simulates a user typing `char` at the current cursor position, going through
// the same `handleTextInput` path that ProseMirror uses in the browser.
function typeChar(editor: Editor, char: string) {
  const { view } = editor;
  const { from, to } = view.state.selection;
  const deflt = () => view.state.tr.insertText(char, from, to);
  const handled = view.someProp('handleTextInput', (fn) => fn(view, from, to, char, deflt));
  if (!handled) {
    view.dispatch(view.state.tr.insertText(char, from, to));
  }
}

describe('SmartQuotes extension', () => {
  describe('when enabled', () => {
    it('turns a leading double quote into an opening curly quote', () => {
      const editor = makeEditor(true);
      editor.commands.focus('end');
      typeChar(editor, '"');
      expect(editor.getText()).toBe('\u201C');
      editor.destroy();
    });

    it('turns a double quote after a letter into a closing curly quote', () => {
      const editor = makeEditor(true, '<p>hi</p>');
      editor.commands.focus('end');
      typeChar(editor, '"');
      expect(editor.getText()).toBe('hi\u201D');
      editor.destroy();
    });

    it('turns a double quote after whitespace into an opening curly quote', () => {
      const editor = makeEditor(true, '<p>hi world</p>');
      // Position cursor between "hi " and "world" so the character before the
      // quote is a space (HTML parsing would otherwise strip trailing spaces).
      editor.commands.setTextSelection(4);
      typeChar(editor, '"');
      expect(editor.getText()).toBe('hi \u201Cworld');
      editor.destroy();
    });

    it('turns a single quote after a letter into a closing curly quote (apostrophe)', () => {
      const editor = makeEditor(true, '<p>it</p>');
      editor.commands.focus('end');
      typeChar(editor, "'");
      expect(editor.getText()).toBe('it\u2019');
      editor.destroy();
    });

    it('turns a leading single quote into an opening curly quote', () => {
      const editor = makeEditor(true);
      editor.commands.focus('end');
      typeChar(editor, "'");
      expect(editor.getText()).toBe('\u2018');
      editor.destroy();
    });
  });

  describe('when disabled', () => {
    it('leaves a double quote straight', () => {
      const editor = makeEditor(false, '<p>hi</p>');
      editor.commands.focus('end');
      typeChar(editor, '"');
      expect(editor.getText()).toBe('hi"');
      editor.destroy();
    });

    it('leaves a single quote straight', () => {
      const editor = makeEditor(false, '<p>it</p>');
      editor.commands.focus('end');
      typeChar(editor, "'");
      expect(editor.getText()).toBe("it'");
      editor.destroy();
    });
  });

  it('reflects a change made via setSmartQuotesEnabled without re-initializing', () => {
    const editor = makeEditor(true, '<p>hi</p>');

    editor.commands.focus('end');
    typeChar(editor, '"');
    expect(editor.getText()).toBe('hi\u201D');

    editor.commands.setSmartQuotesEnabled(false);
    typeChar(editor, '"');
    expect(editor.getText()).toBe('hi\u201D"');

    editor.destroy();
  });
});
