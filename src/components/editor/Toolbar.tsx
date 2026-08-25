'use client';

import { useCallback } from 'react';
import type { Editor } from '@tiptap/react';
import { cn } from '@/lib/class-utils';

interface ToolbarProps {
  editor: Editor | null;
}

interface ToolbarButtonProps {
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  ariaLabel: string;
  style?: 'bold' | 'italic' | 'underline' | 'strike' | 'normal';
}

function ToolbarButton({
  label,
  onClick,
  active = false,
  disabled = false,
  ariaLabel,
  style = 'normal',
}: ToolbarButtonProps) {
  const styleClass = {
    bold: 'font-bold',
    italic: 'italic',
    underline: 'underline',
    strike: 'line-through',
    normal: '',
  }[style];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-pressed={active}
      className={cn(
        'min-w-[2rem] rounded-md px-2 py-1 text-sm transition-colors',
        styleClass,
        active
          ? 'bg-zinc-200 text-zinc-900 dark:bg-zinc-700 dark:text-zinc-50'
          : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800',
        disabled && 'cursor-not-allowed opacity-40'
      )}
    >
      {label}
    </button>
  );
}

function ToolbarDivider() {
  return (
    <span
      role="separator"
      aria-orientation="vertical"
      className="mx-1 h-6 w-px bg-zinc-200 dark:bg-zinc-700"
    />
  );
}

export function Toolbar({ editor }: ToolbarProps) {
  const promptForLink = useCallback(() => {
    if (!editor) return;
    const previous = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('URL', previous ?? '');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().setLink({ href: url }).run();
  }, [editor]);

  if (!editor) {
    return (
      <div
        role="toolbar"
        aria-label="Editor toolbar"
        className="flex flex-wrap items-center gap-1 border-b border-zinc-200 p-2 dark:border-zinc-800"
      />
    );
  }

  return (
    <div
      role="toolbar"
      aria-label="Editor toolbar"
      className="flex flex-wrap items-center gap-1 border-b border-zinc-200 p-2 dark:border-zinc-800"
    >
      <ToolbarButton
        label="Undo"
        ariaLabel="Undo"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
      />
      <ToolbarButton
        label="Redo"
        ariaLabel="Redo"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
      />
      <ToolbarDivider />
      <ToolbarButton
        label="B"
        ariaLabel="Bold"
        style="bold"
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
      />
      <ToolbarButton
        label="I"
        ariaLabel="Italic"
        style="italic"
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      />
      <ToolbarButton
        label="U"
        ariaLabel="Underline"
        style="underline"
        active={editor.isActive('underline')}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      />
      <ToolbarButton
        label="S"
        ariaLabel="Strikethrough"
        style="strike"
        active={editor.isActive('strike')}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      />
      <ToolbarDivider />
      <ToolbarButton
        label="H1"
        ariaLabel="Heading 1"
        active={editor.isActive('heading', { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      />
      <ToolbarButton
        label="H2"
        ariaLabel="Heading 2"
        active={editor.isActive('heading', { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      />
      <ToolbarButton
        label="H3"
        ariaLabel="Heading 3"
        active={editor.isActive('heading', { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      />
      <ToolbarDivider />
      <ToolbarButton
        label="• List"
        ariaLabel="Bullet list"
        active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      />
      <ToolbarButton
        label="1. List"
        ariaLabel="Numbered list"
        active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      />
      <ToolbarDivider />
      <ToolbarButton
        label="Link"
        ariaLabel="Insert link"
        active={editor.isActive('link')}
        onClick={promptForLink}
      />
      <ToolbarButton
        label="Table"
        ariaLabel="Insert table"
        onClick={() =>
          editor.chain().focus().insertTable({ rows: 2, cols: 2, withHeaderRow: false }).run()
        }
      />
    </div>
  );
}
