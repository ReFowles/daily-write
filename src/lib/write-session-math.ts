/**
 * Pure helpers for the write page's word-count and dirty-state math.
 * Keeping this out of the component makes the accounting rules easy to test:
 *
 *  words written today = words already saved for today
 *                      + max(0, current doc words − doc's starting words)
 *
 * The `max(0, …)` means deleting characters you just wrote reduces the
 * running total, but deleting characters that were already in the document
 * when you opened it does not send the counter negative.
 */

export interface DocWordCountInput {
  /** Word count when the tab/doc was first loaded. */
  docStartWordCount: number;
  /** Live word count of the currently rendered content. */
  wordCount: number;
}

export interface SessionWordCountInput extends DocWordCountInput {
  /** Words already credited to today's session before this document was opened. */
  sessionStartWordCount: number;
}

export function computeCurrentDocWordsAdded(input: DocWordCountInput): number {
  return Math.max(0, input.wordCount - input.docStartWordCount);
}

export function computeWordsWrittenToday(input: SessionWordCountInput): number {
  return input.sessionStartWordCount + computeCurrentDocWordsAdded(input);
}

export interface UnsavedDocChangesInput<Doc, Content> {
  selectedDoc: Doc | null;
  content: Content | null;
  lastSavedContent: Content | null;
  showPicker: boolean;
  contentsEqual: (a: Content, b: Content | null) => boolean;
}

export function hasUnsavedDocChanges<Doc, Content>(
  input: UnsavedDocChangesInput<Doc, Content>
): boolean {
  const { selectedDoc, content, lastSavedContent, showPicker, contentsEqual } = input;
  if (!selectedDoc || !content || showPicker) return false;
  return !contentsEqual(content, lastSavedContent);
}

export function hasUnsavedSessionChanges(
  wordsWrittenToday: number,
  lastSavedCount: number
): boolean {
  return wordsWrittenToday > 0 && wordsWrittenToday !== lastSavedCount;
}
