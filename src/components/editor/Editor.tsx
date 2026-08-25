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
import { contentsEqual, type DocumentContent } from '@/lib/document-content';
import { Toolbar } from './Toolbar';

export interface EditorProps {
  content: DocumentContent | null;
  onChange: (content: DocumentContent) => void;
  placeholder?: string;
  className?: string;
}

export function Editor({ content, onChange, placeholder, className }: EditorProps) {
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
          'prose dark:prose-invert max-w-none focus:outline-none min-h-[400px] p-4',
          className
        ),
      },
    },
    onUpdate: ({ editor: current }) => {
      onChange(current.getJSON() as DocumentContent);
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
      <EditorContent editor={editor} />
    </div>
  );
}

export type EditorInstance = TiptapEditor;
