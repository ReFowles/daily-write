'use client';

import { 
  MDXEditor, 
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  linkPlugin,
  linkDialogPlugin,
  toolbarPlugin,
  UndoRedo,
  BoldItalicUnderlineToggles,
  BlockTypeSelect,
  CreateLink,
  ListsToggle,
  type MDXEditorMethods
} from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css';
import { forwardRef } from 'react';

interface MarkdownEditorProps {
  markdown: string;
  onChange: (markdown: string) => void;
  placeholder?: string;
}

const MarkdownEditor = forwardRef<MDXEditorMethods, MarkdownEditorProps>(
  ({ markdown, onChange, placeholder }, ref) => {
    return (
      <div className="mdx-editor-wrapper">
        <MDXEditor
          ref={ref}
          markdown={markdown}
          onChange={onChange}
          placeholder={placeholder}
          plugins={[
            toolbarPlugin({
              toolbarContents: () => (
                <>
                  <UndoRedo />
                  <BoldItalicUnderlineToggles />
                  <BlockTypeSelect />
                  <CreateLink />
                  <ListsToggle />
                </>
              )
            }),
            headingsPlugin(),
            listsPlugin(),
            quotePlugin(),
            thematicBreakPlugin(),
            markdownShortcutPlugin(),
            linkPlugin(),
            linkDialogPlugin(),
          ]}
          contentEditableClassName="prose dark:prose-invert max-w-none focus:outline-none p-4"
        />
      </div>
    );
  }
);

MarkdownEditor.displayName = 'MarkdownEditor';

export default MarkdownEditor;
