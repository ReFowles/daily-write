'use client';

import { useCallback, type ReactNode } from 'react';
import { useEditorState, type Editor } from '@tiptap/react';
import {
  LuBold,
  LuHeading1,
  LuHeading2,
  LuHeading3,
  LuItalic,
  LuLink,
  LuList,
  LuListOrdered,
  LuRedo2,
  LuStrikethrough,
  LuTable,
  LuUnderline,
  LuUndo2,
} from 'react-icons/lu';
import { cn } from '@/lib/class-utils';

interface ToolbarProps {
  editor: Editor | null;
}

interface ToolbarButtonProps {
  icon: ReactNode;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  ariaLabel: string;
}

const inactiveClasses = 'text-fg-muted hover:bg-surface-muted hover:text-fg';

const activeClasses = 'bg-accent-subtle text-accent-subtle-fg';

const toolbarContainerClasses =
  'sticky top-0 z-10 flex flex-wrap items-center gap-1 border-b p-2 border-line bg-surface-muted';

const dividerClasses = 'mx-1 h-6 w-px bg-line';

function ToolbarButton({
  icon,
  onClick,
  active = false,
  disabled = false,
  ariaLabel,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-pressed={active}
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-md text-base transition-colors',
        active ? activeClasses : inactiveClasses,
        disabled && 'cursor-not-allowed opacity-40'
      )}
    >
      {icon}
    </button>
  );
}

function ToolbarDivider() {
  return (
    <span role="separator" aria-orientation="vertical" className={dividerClasses} />
  );
}

export function Toolbar({ editor }: ToolbarProps) {
  const state = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      canUndo: current?.can().undo() ?? false,
      canRedo: current?.can().redo() ?? false,
      isBold: current?.isActive('bold') ?? false,
      isItalic: current?.isActive('italic') ?? false,
      isUnderline: current?.isActive('underline') ?? false,
      isStrike: current?.isActive('strike') ?? false,
      isH1: current?.isActive('heading', { level: 1 }) ?? false,
      isH2: current?.isActive('heading', { level: 2 }) ?? false,
      isH3: current?.isActive('heading', { level: 3 }) ?? false,
      isBulletList: current?.isActive('bulletList') ?? false,
      isOrderedList: current?.isActive('orderedList') ?? false,
      isLink: current?.isActive('link') ?? false,
    }),
  });

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

  if (!editor || !state) {
    return (
      <div role="toolbar" aria-label="Editor toolbar" className={toolbarContainerClasses} />
    );
  }

  return (
    <div role="toolbar" aria-label="Editor toolbar" className={toolbarContainerClasses}>
      <ToolbarButton
        icon={<LuBold aria-hidden />}
        ariaLabel="Bold"
        active={state.isBold}
        onClick={() => editor.chain().focus().toggleBold().run()}
      />
      <ToolbarButton
        icon={<LuItalic aria-hidden />}
        ariaLabel="Italic"
        active={state.isItalic}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      />
      <ToolbarButton
        icon={<LuUnderline aria-hidden />}
        ariaLabel="Underline"
        active={state.isUnderline}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      />
      <ToolbarButton
        icon={<LuStrikethrough aria-hidden />}
        ariaLabel="Strikethrough"
        active={state.isStrike}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      />
      <ToolbarDivider />
      <ToolbarButton
        icon={<LuHeading1 aria-hidden />}
        ariaLabel="Heading 1"
        active={state.isH1}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      />
      <ToolbarButton
        icon={<LuHeading2 aria-hidden />}
        ariaLabel="Heading 2"
        active={state.isH2}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      />
      <ToolbarButton
        icon={<LuHeading3 aria-hidden />}
        ariaLabel="Heading 3"
        active={state.isH3}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      />
      <ToolbarDivider />
      <ToolbarButton
        icon={<LuList aria-hidden />}
        ariaLabel="Bullet list"
        active={state.isBulletList}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      />
      <ToolbarButton
        icon={<LuListOrdered aria-hidden />}
        ariaLabel="Numbered list"
        active={state.isOrderedList}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      />
      <ToolbarDivider />
      <ToolbarButton
        icon={<LuLink aria-hidden />}
        ariaLabel="Insert link"
        active={state.isLink}
        onClick={promptForLink}
      />
      <ToolbarButton
        icon={<LuTable aria-hidden />}
        ariaLabel="Insert table"
        onClick={() =>
          editor.chain().focus().insertTable({ rows: 2, cols: 2, withHeaderRow: false }).run()
        }
      />
      <div className="ml-auto flex items-center gap-1">
        <ToolbarButton
          icon={<LuUndo2 aria-hidden />}
          ariaLabel="Undo"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!state.canUndo}
        />
        <ToolbarButton
          icon={<LuRedo2 aria-hidden />}
          ariaLabel="Redo"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!state.canRedo}
        />
      </div>
    </div>
  );
}
