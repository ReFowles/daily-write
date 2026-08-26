'use client';

import { useEffect, useMemo } from 'react';
import { useEditor, EditorContent, type Editor as TiptapEditor } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Underline } from '@tiptap/extension-underline';
import { Link } from '@tiptap/extension-link';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { cn } from '@/lib/class-utils';
import { canonicalizeContent, contentsEqual, type DocumentContent } from '@/lib/document-content';
import { Toolbar } from './Toolbar';
import { DocParagraphStylePassthrough, DocTextStyleMark } from './doc-style-passthrough';

export interface EditorProps {
  content: DocumentContent | null;
  onChange: (content: DocumentContent) => void;
  placeholder?: string;
  className?: string;
  lineSpacing?: LineSpacing;
  paragraphIndent?: boolean;
}

export type LineSpacing = 'normal' | 'relaxed' | 'spacious';

// Descendant-selector classes; prose uses :where() so any direct selector wins.
const LINE_SPACING_CLASSES: Record<LineSpacing, string> = {
  normal: '',
  relaxed: '[&_p]:leading-loose [&_li]:leading-loose',
  spacious: '[&_p]:leading-[2.5] [&_li]:leading-[2.5]',
};

const PARAGRAPH_INDENT_CLASS = '[&_p]:indent-8';

export function Editor({ content, onChange, placeholder, className, lineSpacing = 'normal', paragraphIndent = false }: EditorProps) {
  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: false,
        underline: false,
        // Extensions we have no Google Docs mapping for. Leaving them enabled
        // means a stray `>` or ``` in the editor produces JSON the
        // canonicalizer silently drops, which then makes the diff planner see
        // a mismatch and fall back to a full-replace save.
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
        code: false,
      }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({ placeholder: placeholder ?? 'Start writing...' }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      DocParagraphStylePassthrough,
      DocTextStyleMark,
    ],
    [placeholder]
  );

  const editor = useEditor({
    extensions,
    content: content ?? { type: 'doc', content: [{ type: 'paragraph' }] },
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: cn(
          'prose max-w-none focus:outline-none min-h-[400px] p-4',
          'dark:prose-invert cherry:prose-invert ocean:prose-invert',
          'text-zinc-900 dark:text-zinc-100',
          'strawberry:text-rose-900 cherry:text-rose-100',
          'seafoam:text-cyan-900 ocean:text-cyan-100',
          className
        ),
      },
    },
    onUpdate: ({ editor: current }) => {
      onChange(canonicalizeContent(current.getJSON() as DocumentContent));
    },
  });

  useEffect(() => {
    if (!editor) return;
    const currentJson = editor.getJSON() as DocumentContent;
    if (content && !contentsEqual(currentJson, content)) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content, editor]);

  return (
    <div className="editor-root">
      <Toolbar editor={editor} />
      <div className={cn(LINE_SPACING_CLASSES[lineSpacing], paragraphIndent && PARAGRAPH_INDENT_CLASS)}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

export type EditorInstance = TiptapEditor;
