/**
 * Pure helpers for the write page's word-count and dirty-state math.
 * Keeping this out of the component makes the accounting rules easy to test:
 *
 *  words written today = max(0, session baseline
 *                              + (current doc words − doc's starting words))
 *
 * The delta is *not* clamped per-doc, because we can't tell whether words
 * being deleted are pre-existing content or writing the user did earlier
 * today (and already got credit for) in the same doc. Clamping only at zero
 * lets deletions of your own prior writing decrement "words today"; the
 * outer clamp keeps a large cleanup pass from producing a negative total.
 *
 * Because the clamp only affects the *displayed* total, a deep deletion still
 * leaves a negative balance sitting behind the scenes that new writing has to
 * pay off before the display moves again. `ratchetDocStartWordCount` is
 * called (from an effect, on every wordCount change) to pull the doc-start
 * baseline up whenever that would happen, so zero is a real floor: any word
 * typed after hitting it is credited immediately.
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
  return Math.max(
    0,
    input.sessionStartWordCount + (input.wordCount - input.docStartWordCount)
  );
}

/**
 * If the raw (unclamped) total has dropped below zero, ratchets
 * docStartWordCount up so the total reads exactly zero instead of a negative
 * balance the user would otherwise have to "earn back" with new writing
 * before the displayed count moves again. Returns the input's
 * docStartWordCount unchanged when no ratchet is needed.
 */
export function ratchetDocStartWordCount(input: SessionWordCountInput): number {
  const unclamped =
    input.sessionStartWordCount + (input.wordCount - input.docStartWordCount);
  if (unclamped >= 0) return input.docStartWordCount;
  return input.sessionStartWordCount + input.wordCount;
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
  return wordsWrittenToday !== lastSavedCount;
}
