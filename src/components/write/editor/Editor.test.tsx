import { describe, expect, it, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { Editor } from './Editor';
import type { DocumentContent } from '@/lib/document-content';

describe('<Editor />', () => {
  const initialContent: DocumentContent = {
    type: 'doc',
    content: [
      { type: 'paragraph', content: [{ type: 'text', text: 'hello' }] },
    ],
  };

  it('renders the toolbar with formatting controls', async () => {
    render(<Editor content={initialContent} onChange={() => {}} />);

    expect(await screen.findByRole('toolbar', { name: /editor toolbar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bold' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Italic' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Underline' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Strikethrough' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Heading 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Heading 2' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Heading 3' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bullet list' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Numbered list' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Insert link' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Insert table' })).toBeInTheDocument();
  });

  it('renders a smart quotes toggle that reflects state and calls the handler', async () => {
    const onToggleSmartQuotes = vi.fn();
    render(
      <Editor
        content={initialContent}
        onChange={() => {}}
        smartQuotes={false}
        onToggleSmartQuotes={onToggleSmartQuotes}
      />
    );

    const button = await screen.findByRole('button', { name: 'Turn on smart quotes' });
    expect(button).toHaveAttribute('aria-pressed', 'false');

    act(() => {
      button.click();
    });
    expect(onToggleSmartQuotes).toHaveBeenCalledTimes(1);
  });

  it('renders the initial content', async () => {
    render(<Editor content={initialContent} onChange={() => {}} />);
    expect(await screen.findByText('hello')).toBeInTheDocument();
  });

  it('emits onChange with a heading node after toggling H2', async () => {
    const onChange = vi.fn();
    render(<Editor content={initialContent} onChange={onChange} />);
    const h2Button = await screen.findByRole('button', { name: 'Heading 2' });

    act(() => {
      h2Button.click();
    });

    const last = onChange.mock.calls[onChange.mock.calls.length - 1][0] as DocumentContent;
    expect(last.content[0]).toMatchObject({ type: 'heading', attrs: { level: 2 } });
  });

  it('emits onChange with a bulletList after toggling the bullet list button', async () => {
    const onChange = vi.fn();
    render(<Editor content={initialContent} onChange={onChange} />);
    const bulletButton = await screen.findByRole('button', { name: 'Bullet list' });

    act(() => {
      bulletButton.click();
    });

    const last = onChange.mock.calls[onChange.mock.calls.length - 1][0] as DocumentContent;
    expect(last.content[0]).toMatchObject({ type: 'bulletList' });
  });

  it('preserves paragraph docStyle attrs and text docStyle marks across a Tiptap round-trip', async () => {
    const onChange = vi.fn();
    const withStyles: DocumentContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          attrs: { docStyle: { lineSpacing: 150, indentFirstLine: { magnitude: 36, unit: 'PT' } } },
          content: [
            {
              type: 'text',
              text: 'styled',
              marks: [
                {
                  type: 'docStyle',
                  attrs: { style: { weightedFontFamily: { fontFamily: 'Georgia', weight: 400 } } },
                },
              ],
            },
          ],
        },
      ],
    };
    render(<Editor content={withStyles} onChange={onChange} />);
    // Trigger any editor mutation (H2 toggle) so onChange fires with the
    // Tiptap-serialized content; the preserved attrs/marks should still be
    // present after canonicalization.
    const h2Button = await screen.findByRole('button', { name: 'Heading 2' });
    act(() => {
      h2Button.click();
    });

    const emitted = onChange.mock.calls[onChange.mock.calls.length - 1][0] as DocumentContent;
    const block = emitted.content[0];
    if (block.type !== 'heading' && block.type !== 'paragraph') {
      throw new Error(`unexpected block type ${block.type}`);
    }
    expect(block.attrs).toMatchObject({
      docStyle: { lineSpacing: 150, indentFirstLine: { magnitude: 36, unit: 'PT' } },
    });
    const run = block.content?.[0];
    expect(run?.marks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'docStyle',
          attrs: { style: { weightedFontFamily: { fontFamily: 'Georgia', weight: 400 } } },
        }),
      ])
    );
  });
});
