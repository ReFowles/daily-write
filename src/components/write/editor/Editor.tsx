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
import { SmartQuotes } from './smart-quotes';

export interface EditorProps {
  content: DocumentContent | null;
  onChange: (content: DocumentContent) => void;
  placeholder?: string;
  className?: string;
  lineSpacing?: LineSpacing;
  fontSize?: FontSize;
  paragraphIndent?: boolean;
  smartQuotes?: boolean;
  onToggleSmartQuotes?: () => void;
}

export type LineSpacing = 'normal' | 'relaxed' | 'spacious';
export type FontSize = 'small' | 'medium' | 'large' | 'xlarge';

// Descendant-selector classes; prose uses :where() so any direct selector wins.
const LINE_SPACING_CLASSES: Record<LineSpacing, string> = {
  normal: '',
  relaxed: '[&_p]:leading-loose [&_li]:leading-loose',
  spacious: '[&_p]:leading-[2.5] [&_li]:leading-[2.5]',
};

const FONT_SIZE_CLASSES: Record<FontSize, string> = {
  small: '[&_p]:text-sm [&_li]:text-sm',
  medium: '',
  large: '[&_p]:text-lg [&_li]:text-lg',
  xlarge: '[&_p]:text-xl [&_li]:text-xl',
};

const PARAGRAPH_INDENT_CLASS = '[&_p]:indent-8';

export function Editor({
  content,
  onChange,
  placeholder,
  className,
  lineSpacing = 'normal',
  fontSize = 'medium',
  paragraphIndent = false,
  smartQuotes = true,
  onToggleSmartQuotes,
}: EditorProps) {
  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: false,
        underline: false,
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
      SmartQuotes,
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
          'prose max-w-none focus:outline-none min-h-[400px] px-4 py-4 sm:px-8 md:px-12 lg:px-20',
          'text-fg',
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

  useEffect(() => {
    if (!editor) return;
    editor.commands.setSmartQuotesEnabled(smartQuotes);
  }, [editor, smartQuotes]);

  return (
    <div className="editor-root flex h-full min-h-0 flex-col">
      <Toolbar editor={editor} smartQuotes={smartQuotes} onToggleSmartQuotes={onToggleSmartQuotes} />
      <div
        className={cn(
          'min-h-0 flex-1 overflow-y-auto',
          LINE_SPACING_CLASSES[lineSpacing],
          FONT_SIZE_CLASSES[fontSize],
          paragraphIndent && PARAGRAPH_INDENT_CLASS
        )}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

export type EditorInstance = TiptapEditor;
