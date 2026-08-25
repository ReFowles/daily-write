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
});
