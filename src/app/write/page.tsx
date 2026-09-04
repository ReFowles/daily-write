"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/PageHeader";
import { useCurrentGoal, invalidateCurrentGoalCache } from "@/lib/use-current-goal";
import { createOrUpdateWritingSession, getWritingSessionByDate } from "@/lib/data-store";
import { toDateString, calculateWordCount } from "@/lib/date-utils";
import { cn } from "@/lib/class-utils";
import { formatWordCount } from "@/lib/format-utils";
import type { GoogleDoc, DocumentTab } from "@/lib/types";
import type { DocumentContent } from "@/lib/document-content";
import { contentsEqual, emptyDocument, getPlainText } from "@/lib/document-content";
import GoogleDocsPicker from "@/components/write/GoogleDocsPicker";
import DocumentTabs from "@/components/write/DocumentTabs";
import { LuBaseline, LuEye, LuEyeOff, LuIndentIncrease } from "react-icons/lu";
import type { LineSpacing as LineSpacingValue } from "@/components/write/editor";
import {
  booleanFromLocalStorage,
  useLocalStorageState,
} from "@/lib/use-local-storage-state";
import { classifyGoogleDocsSaveResponse } from "@/lib/google-docs-save-response";
import {
  computeWordsWrittenToday,
  hasUnsavedDocChanges,
  hasUnsavedSessionChanges,
} from "@/lib/write-session-math";
import dynamic from 'next/dynamic';

const FOCUS_MODE_STORAGE_KEY = "daily-write:focus-mode";
const LINE_SPACING_STORAGE_KEY = "daily-write:line-spacing";
const PARAGRAPH_INDENT_STORAGE_KEY = "daily-write:paragraph-indent";

const LINE_SPACING_CYCLE: readonly LineSpacingValue[] = ['normal', 'relaxed', 'spacious'];
const LINE_SPACING_LABEL: Record<LineSpacingValue, string> = {
  normal: 'Normal',
  relaxed: 'Relaxed',
  spacious: 'Spacious',
};

const lineSpacingFromLocalStorage = (raw: string): LineSpacingValue | undefined =>
  (LINE_SPACING_CYCLE as readonly string[]).includes(raw) ? (raw as LineSpacingValue) : undefined;

const Editor = dynamic(() => import('@/components/write/editor').then((m) => m.Editor), {
  ssr: false,
  loading: () => <div className="p-4 text-gray-500">Loading editor...</div>
});

// Auto-save delay in milliseconds
const AUTO_SAVE_DELAY = 2000;
// Google Docs save delay (longer to avoid too many API calls)
const GOOGLE_DOCS_SAVE_DELAY = 3000;

export default function WritePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { todayGoal, daysLeft, currentGoal, isLoading: isGoalLoading } = useCurrentGoal();
  const [selectedDoc, setSelectedDoc] = useState<GoogleDoc | null>(null);
  const [selectedTab, setSelectedTab] = useState<DocumentTab | null>(null);
  const [showPicker, setShowPicker] = useState(true);
  const [content, setContent] = useState<DocumentContent | null>(null);
  const [wordCount, setWordCount] = useState(0);
  const [docStartWordCount, setDocStartWordCount] = useState(0);
  const [sessionStartWordCount, setSessionStartWordCount] = useState(0);
  const [loadingContent, setLoadingContent] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [lastSavedCount, setLastSavedCount] = useState(0);
  const [lastSavedContent, setLastSavedContent] = useState<DocumentContent | null>(null);
  const [baseRevisionId, setBaseRevisionId] = useState<string | null>(null);
  const [driftBlocked, setDriftBlocked] = useState(false);
  const [docSaveError, setDocSaveError] = useState<string | null>(null);
  const [isDocumentVisible, setIsDocumentVisible] = useState(true);
  const [focusMode, setFocusMode] = useLocalStorageState(
    FOCUS_MODE_STORAGE_KEY,
    false,
    booleanFromLocalStorage
  );
  const [lineSpacing, setLineSpacing] = useLocalStorageState<LineSpacingValue>(
    LINE_SPACING_STORAGE_KEY,
    'normal',
    lineSpacingFromLocalStorage
  );
  const [paragraphIndent, setParagraphIndent] = useLocalStorageState(
    PARAGRAPH_INDENT_STORAGE_KEY,
    false,
    booleanFromLocalStorage
  );

  // Ref to track if we're currently saving to avoid race conditions
  const isSavingToDoc = useRef(false);

  const cycleLineSpacing = useCallback(() => {
    setLineSpacing((current) => {
      const idx = LINE_SPACING_CYCLE.indexOf(current);
      return LINE_SPACING_CYCLE[(idx + 1) % LINE_SPACING_CYCLE.length];
    });
  }, [setLineSpacing]);

  // Track document visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsDocumentVisible(!document.hidden);
    };
    
    // Set initial state
    setIsDocumentVisible(!document.hidden);
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Load today's existing word count from Firestore on mount
  useEffect(() => {
    if (!session?.user?.email) return;

    const loadTodaySession = async () => {
      const today = toDateString(new Date());
      try {
        const existingSession = await getWritingSessionByDate(session.user.email!, today);
        if (existingSession) {
          setSessionStartWordCount(existingSession.wordCount);
          setLastSavedCount(existingSession.wordCount);
        }
      } catch (error) {
        console.error('Failed to load today\'s session:', error);
      }
    };

    loadTodaySession();
  }, [session?.user?.email]);

  // Function to save content to Google Docs. Reads latest baseline state from
  // refs so callers don't need to pass them and the useCallback stays stable.
  const saveStateRef = useRef({ lastSavedContent, baseRevisionId });
  saveStateRef.current = { lastSavedContent, baseRevisionId };

  const saveToGoogleDocs = useCallback(async (docId: string, docContent: DocumentContent, tabId?: string) => {
    if (isSavingToDoc.current) return false;

    isSavingToDoc.current = true;
    setDocSaveError(null);

    try {
      const { lastSavedContent: prevContent, baseRevisionId: baseline } = saveStateRef.current;
      const response = await fetch('/api/google-docs', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId: docId,
          content: docContent,
          tabId,
          prevContent,
          baseRevisionId: baseline,
        }),
      });

      const outcome = await classifyGoogleDocsSaveResponse(response);

      if (outcome.kind === 'drift') {
        setDriftBlocked(true);
        setDocSaveError(outcome.message);
        return false;
      }

      if (outcome.kind === 'error') {
        throw new Error(outcome.message);
      }

      setLastSavedContent(docContent);
      if (outcome.revisionId) {
        setBaseRevisionId(outcome.revisionId);
      }
      if (outcome.saveMode === 'replace') {
        console.warn(
          '[google-docs] save fell back to full-replace:',
          outcome.replaceReason ?? 'unknown reason'
        );
      }
      return true;
    } catch (error) {
      console.error('Error saving to Google Docs:', error);
      setDocSaveError(error instanceof Error ? error.message : 'Failed to save');
      return false;
    } finally {
      isSavingToDoc.current = false;
    }
  }, []);

  const handleSelectDoc = async (doc: GoogleDoc) => {
    setSelectedDoc(doc);
    setSelectedTab(null); // Clear tab selection - will be set by DocumentTabs component
    setShowPicker(false);
    setLoadingContent(true);
    setDocSaveError(null);
    
    // Note: Content will be loaded when a tab is selected
    // The DocumentTabs component will auto-select the first tab
    setContent(null);
    setLastSavedContent(null);
    setBaseRevisionId(null);
    setDriftBlocked(false);
    setWordCount(0);
    setDocStartWordCount(0);
    setLoadingContent(false);
  };

  const handleSelectTab = useCallback(async (tab: DocumentTab) => {
    // Save current content before switching tabs
    if (selectedDoc && selectedTab && content && !contentsEqual(content, lastSavedContent)) {
      await saveToGoogleDocs(selectedDoc.id, content, selectedTab.tabId);
    }

    setSelectedTab(tab);
    setLoadingContent(true);
    setDocSaveError(null);
    
    if (!selectedDoc) return;
    
    // Load the tab content
    try {
      const response = await fetch('/api/google-docs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documentId: selectedDoc.id, tabId: tab.tabId }),
      });

      if (!response.ok) {
        throw new Error('Failed to load tab content');
      }

      const data = await response.json();
      const loadedContent: DocumentContent = data.content ?? emptyDocument();
      setContent(loadedContent);
      setLastSavedContent(loadedContent);
      setBaseRevisionId(typeof data.revisionId === 'string' ? data.revisionId : null);
      setDriftBlocked(false);
      
      // Calculate initial word count from loaded content
      const initialCount = calculateWordCount(getPlainText(loadedContent));
      setWordCount(initialCount);
      setDocStartWordCount(initialCount);
    } catch (error) {
      console.error('Error loading tab content:', error);
      setContent(emptyDocument());
      setLastSavedContent(emptyDocument());
      setBaseRevisionId(null);
      setDocStartWordCount(0);
    } finally {
      setLoadingContent(false);
    }
  }, [selectedDoc, selectedTab, content, lastSavedContent, saveToGoogleDocs]);

  const handleContentChange = useCallback((next: DocumentContent) => {
    setContent(next);
    setSaveStatus('unsaved');
    
    // Debounce word count calculation slightly to avoid blocking on every keystroke
    requestAnimationFrame(() => {
      const currentCount = calculateWordCount(getPlainText(next));
      setWordCount(currentCount);
    });
  }, []);
  
  // Words added in current document = current - where doc started
  // This allows deletions to reduce the count if you delete what you just wrote
  const wordsWrittenToday = computeWordsWrittenToday({
    sessionStartWordCount,
    wordCount,
    docStartWordCount,
  });

  // Check if there are unsaved Google Docs changes
  const hasUnsavedDocChangesFlag = hasUnsavedDocChanges({
    selectedDoc,
    content,
    lastSavedContent,
    showPicker,
    contentsEqual,
  });

  // Check if there are unsaved Firestore changes
  const hasUnsavedSessionChangesFlag = hasUnsavedSessionChanges(
    wordsWrittenToday,
    lastSavedCount
  );

  // Snapshot of state read inside the visibility-refresh effect below without
  // adding those values to the effect's dep list.
  const refreshStateRef = useRef({
    selectedDoc,
    selectedTab,
    hasUnsavedDocChanges: hasUnsavedDocChangesFlag,
    lastSavedContent,
  });
  refreshStateRef.current = {
    selectedDoc,
    selectedTab,
    hasUnsavedDocChanges: hasUnsavedDocChangesFlag,
    lastSavedContent,
  };

  // Pick up external edits made in Google Docs while the app was in the
  // background. Skipped while there are unsaved local edits so we never
  // clobber the user's in-progress work.
  useEffect(() => {
    if (!isDocumentVisible) return;
    const snapshot = refreshStateRef.current;
    if (!snapshot.selectedDoc || !snapshot.selectedTab) return;
    if (snapshot.hasUnsavedDocChanges) return;

    let cancelled = false;
    const doc = snapshot.selectedDoc;
    const tab = snapshot.selectedTab;

    (async () => {
      try {
        const response = await fetch('/api/google-docs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ documentId: doc.id, tabId: tab.tabId }),
        });
        if (cancelled || !response.ok) return;
        const data = await response.json();
        const fetched: DocumentContent = data.content ?? emptyDocument();
        const fetchedRevisionId: string | null =
          typeof data.revisionId === 'string' ? data.revisionId : null;

        const latest = refreshStateRef.current;
        if (cancelled) return;
        if (latest.selectedDoc?.id !== doc.id) return;
        if (latest.selectedTab?.tabId !== tab.tabId) return;
        if (latest.hasUnsavedDocChanges) return;
        if (contentsEqual(fetched, latest.lastSavedContent)) {
          if (fetchedRevisionId) setBaseRevisionId(fetchedRevisionId);
          return;
        }

        setContent(fetched);
        setLastSavedContent(fetched);
        if (fetchedRevisionId) setBaseRevisionId(fetchedRevisionId);
        setDriftBlocked(false);
        const refreshedCount = calculateWordCount(getPlainText(fetched));
        setWordCount(refreshedCount);
        setDocStartWordCount(refreshedCount);
      } catch (error) {
        console.error('Failed to refresh content from Google Docs:', error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isDocumentVisible]);

  // Auto-save to Google Docs when content changes (only when visible and has changes)
  useEffect(() => {
    // Don't save if app is not visible, no unsaved changes, or the server told
    // us the doc drifted (user must reload the tab to unblock).
    if (!isDocumentVisible || !hasUnsavedDocChangesFlag || driftBlocked) {
      return;
    }

    const timeoutId = setTimeout(async () => {
      if (!selectedDoc || !content) return;
      
      setSaveStatus('saving');
      const success = await saveToGoogleDocs(selectedDoc.id, content, selectedTab?.tabId);
      if (success) {
        setSaveStatus('saved');
      } else {
        setSaveStatus('unsaved');
      }
    }, GOOGLE_DOCS_SAVE_DELAY);

    return () => clearTimeout(timeoutId);
  }, [content, isDocumentVisible, hasUnsavedDocChangesFlag, driftBlocked, selectedDoc, selectedTab, saveToGoogleDocs]);

  // Auto-save writing session to Firestore (only when visible and has changes)
  useEffect(() => {
    // Don't save if no user, app not visible, or no unsaved changes
    if (!session?.user?.email || !isDocumentVisible || !hasUnsavedSessionChangesFlag) {
      return;
    }

    // Save after delay when user stops typing
    const timeoutId = setTimeout(async () => {
      const today = toDateString(new Date());
      try {
        await createOrUpdateWritingSession({
          userId: session.user.email!,
          date: today,
          wordCount: wordsWrittenToday,
        });
        setLastSavedCount(wordsWrittenToday);
        setSessionStartWordCount(wordsWrittenToday);
        // Reset document baseline so we don't double-count these words
        setDocStartWordCount(wordCount);
        // Drop the cached goal snapshot so other pages refetch today's progress on next mount.
        invalidateCurrentGoalCache(session.user.email!);
      } catch (error) {
        console.error('Failed to save writing session:', error);
      }
    }, AUTO_SAVE_DELAY);

    return () => clearTimeout(timeoutId);
  }, [session?.user?.email, wordsWrittenToday, wordCount, isDocumentVisible, hasUnsavedSessionChangesFlag]);

  // Redirect if not authenticated (after all hooks)
  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center" role="status" aria-live="polite">
        <p className="text-lg text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!session) {
    router.push("/about");
    return null;
  }

  return (
    <main
      className={cn(
        "surface-page",
        showPicker ? "min-h-[calc(100vh-4rem)] overflow-y-auto" : "h-[calc(100vh-4rem)] overflow-hidden",
      )}
    >
      <div
        className={cn(
          "mx-auto flex max-w-5xl flex-col px-3 py-4 sm:px-6 sm:py-8 lg:px-8",
          showPicker ? "min-h-full" : "h-full",
        )}
      >
        <PageHeader
          title={selectedDoc && !showPicker ? selectedDoc.name : "Write"}
          description={
            selectedDoc && !showPicker ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowPicker(true)}
                aria-label="Change selected document"
                className="mt-2 cursor-pointer"
              >
                Change Document
              </Button>
            ) : (
              "Start your daily writing session"
            )
          }
          dailyGoal={todayGoal}
          daysLeft={daysLeft}
          writtenToday={wordsWrittenToday}
          goalStartDate={currentGoal?.startDate}
          goalEndDate={currentGoal?.endDate}
          hideStats={focusMode}
          isLoading={isGoalLoading}
        />

        {/* Google Docs Picker */}
        {showPicker && (
          <div className="mb-6">
            <GoogleDocsPicker
              onSelectDoc={handleSelectDoc}
              selectedDocId={selectedDoc?.id}
            />
          </div>
        )}

        {/* Markdown Editor */}
        {selectedDoc && !showPicker && (
          <Card className="flex flex-1 flex-col overflow-hidden">
            {/* Document Tabs */}
            <DocumentTabs
              documentId={selectedDoc.id}
              selectedTabId={selectedTab?.tabId}
              onSelectTab={handleSelectTab}
            />
            
            {loadingContent ? (
              <div className="flex items-center justify-center p-12" role="status" aria-live="polite">
                <p className="text-fg-muted">
                  Loading document content...
                </p>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto">
                  <Editor
                    key={`${selectedDoc.id}-${selectedTab?.tabId ?? 'default'}`}
                    content={content}
                    onChange={handleContentChange}
                    placeholder="Start writing..."
                    lineSpacing={lineSpacing}
                    paragraphIndent={paragraphIndent}
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line p-3 sm:p-4">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                    <button
                      type="button"
                      onClick={() => setFocusMode((v) => !v)}
                      aria-pressed={focusMode}
                      aria-label={focusMode ? "Exit focus mode" : "Enter focus mode"}
                      title={focusMode ? "Exit focus mode" : "Enter focus mode"}
                      className="cursor-pointer rounded p-1 text-fg-subtle transition-colors hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring"
                    >
                      {focusMode ? <LuEyeOff className="h-4 w-4" /> : <LuEye className="h-4 w-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={cycleLineSpacing}
                      aria-label={`Line spacing: ${LINE_SPACING_LABEL[lineSpacing]}. Click to cycle.`}
                      title={`Line spacing: ${LINE_SPACING_LABEL[lineSpacing]}`}
                      className="cursor-pointer rounded p-1 text-fg-subtle transition-colors hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring"
                    >
                      <LuBaseline className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setParagraphIndent((v) => !v)}
                      aria-pressed={paragraphIndent}
                      aria-label={paragraphIndent ? "Turn off paragraph indent" : "Turn on paragraph indent"}
                      title={paragraphIndent ? "Paragraph indent: on" : "Paragraph indent: off"}
                      className={cn(
                        "cursor-pointer rounded p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring",
                        paragraphIndent
                          ? "bg-accent-subtle text-accent-subtle-fg"
                          : "text-fg-subtle hover:text-fg"
                      )}
                    >
                      <LuIndentIncrease className="h-4 w-4" />
                    </button>
                    {!focusMode && (
                      <div className="flex gap-4 text-sm text-fg-muted">
                        <div>
                          <span className="font-semibold">{formatWordCount(wordsWrittenToday)}</span> Words Today
                        </div>
                        <div className="text-fg-faint">
                          {formatWordCount(wordCount)} Words in Doc
                        </div>
                      </div>
                    )}
                  </div>
                  <div 
                    className="flex items-center gap-3 text-xs"
                    role="status"
                    aria-live="polite"
                    aria-atomic="true"
                  >
                    {docSaveError && (
                      <span className="text-red-500 dark:text-red-400">
                        Error: {docSaveError}
                      </span>
                    )}
                    <span className="text-fg-subtle">
                      {saveStatus === 'saving' && 'Saving to Google Docs...'}
                      {saveStatus === 'saved' && !docSaveError && 'Saved to Google Docs'}
                      {saveStatus === 'unsaved' && !docSaveError && 'Unsaved changes'}
                    </span>
                  </div>
                </div>
              </>
            )}
          </Card>
        )}
      </div>
    </main>
  );
}
