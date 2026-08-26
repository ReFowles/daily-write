import { describe, expect, it } from "vitest";
import {
  computeCurrentDocWordsAdded,
  computeWordsWrittenToday,
  hasUnsavedDocChanges,
  hasUnsavedSessionChanges,
} from "./write-session-math";

describe("computeCurrentDocWordsAdded", () => {
  it("returns the delta above the doc's opening word count", () => {
    expect(
      computeCurrentDocWordsAdded({ docStartWordCount: 100, wordCount: 175 })
    ).toBe(75);
  });

  it("clamps at zero when the user deletes pre-existing content", () => {
    expect(
      computeCurrentDocWordsAdded({ docStartWordCount: 100, wordCount: 80 })
    ).toBe(0);
  });

  it("returns zero when the count is unchanged", () => {
    expect(
      computeCurrentDocWordsAdded({ docStartWordCount: 42, wordCount: 42 })
    ).toBe(0);
  });
});

describe("computeWordsWrittenToday", () => {
  it("adds the current doc's delta on top of the session baseline", () => {
    expect(
      computeWordsWrittenToday({
        sessionStartWordCount: 400,
        docStartWordCount: 100,
        wordCount: 250,
      })
    ).toBe(400 + 150);
  });

  it("preserves the session baseline when the user opens a doc with words in it", () => {
    // Opening an existing doc: docStart === wordCount → 0 added.
    expect(
      computeWordsWrittenToday({
        sessionStartWordCount: 400,
        docStartWordCount: 1000,
        wordCount: 1000,
      })
    ).toBe(400);
  });

  it("never sends the total below the session baseline", () => {
    expect(
      computeWordsWrittenToday({
        sessionStartWordCount: 400,
        docStartWordCount: 1000,
        wordCount: 500,
      })
    ).toBe(400);
  });
});

describe("hasUnsavedDocChanges", () => {
  const eq = (a: string, b: string | null) => a === b;

  it("is false with no selected document", () => {
    expect(
      hasUnsavedDocChanges({
        selectedDoc: null,
        content: "hi",
        lastSavedContent: null,
        showPicker: false,
        contentsEqual: eq,
      })
    ).toBe(false);
  });

  it("is false while the picker is open", () => {
    expect(
      hasUnsavedDocChanges({
        selectedDoc: { id: "d1" },
        content: "hi",
        lastSavedContent: null,
        showPicker: true,
        contentsEqual: eq,
      })
    ).toBe(false);
  });

  it("is false when content matches the last saved snapshot", () => {
    expect(
      hasUnsavedDocChanges({
        selectedDoc: { id: "d1" },
        content: "same",
        lastSavedContent: "same",
        showPicker: false,
        contentsEqual: eq,
      })
    ).toBe(false);
  });

  it("is true when content differs from the last saved snapshot", () => {
    expect(
      hasUnsavedDocChanges({
        selectedDoc: { id: "d1" },
        content: "new",
        lastSavedContent: "old",
        showPicker: false,
        contentsEqual: eq,
      })
    ).toBe(true);
  });

  it("treats a null lastSavedContent baseline as differing from any content", () => {
    expect(
      hasUnsavedDocChanges({
        selectedDoc: { id: "d1" },
        content: "typed",
        lastSavedContent: null,
        showPicker: false,
        contentsEqual: eq,
      })
    ).toBe(true);
  });
});

describe("hasUnsavedSessionChanges", () => {
  it("is false when no words have been written today", () => {
    expect(hasUnsavedSessionChanges(0, 0)).toBe(false);
  });

  it("is false once the running total has been persisted", () => {
    expect(hasUnsavedSessionChanges(500, 500)).toBe(false);
  });

  it("is true when the running total exceeds the last saved value", () => {
    expect(hasUnsavedSessionChanges(600, 500)).toBe(true);
  });

  it("is true when the running total is below the last saved value", () => {
    // Editing a saved doc and deleting later text can push the total down;
    // we still want to flush the new (lower) figure to Firestore.
    expect(hasUnsavedSessionChanges(450, 500)).toBe(true);
  });
});
