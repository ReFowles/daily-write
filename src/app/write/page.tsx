"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/PageHeader";
import { useCurrentGoal } from "@/lib/use-current-goal";
import { createOrUpdateWritingSession, getWritingSessionByDate } from "@/lib/data-store";
import { toDateString, calculateWordCount } from "@/lib/date-utils";
import type { GoogleDoc } from "@/lib/types";
import GoogleDocsPicker from "@/components/GoogleDocsPicker";
import dynamic from 'next/dynamic';

const MarkdownEditor = dynamic(() => import('@/components/MarkdownEditor'), {
  ssr: false,
  loading: () => <div className="p-4 text-gray-500">Loading editor...</div>
});

// Auto-save delay in milliseconds
const AUTO_SAVE_DELAY = 2000;

export default function WritePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { todayGoal, daysLeft, currentGoal } = useCurrentGoal();
  const [selectedDoc, setSelectedDoc] = useState<GoogleDoc | null>(null);
  const [showPicker, setShowPicker] = useState(true);
  const [content, setContent] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [docStartWordCount, setDocStartWordCount] = useState(0);
  const [sessionStartWordCount, setSessionStartWordCount] = useState(0);
  const [loadingContent, setLoadingContent] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [lastSavedCount, setLastSavedCount] = useState(0);

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

  const handleSelectDoc = async (doc: GoogleDoc) => {
    setSelectedDoc(doc);
    setShowPicker(false);
    setLoadingContent(true);
    
    // Load the document content
    try {
      const response = await fetch('/api/google-docs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documentId: doc.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to load document content');
      }

      const data = await response.json();
      const loadedContent = data.markdown || '';
      setContent(loadedContent);
      
      // Calculate initial word count from loaded content
      const initialCount = calculateWordCount(loadedContent);
      setWordCount(initialCount);
      setDocStartWordCount(initialCount);
      // Note: sessionStartWordCount is NOT reset - it preserves progress from all docs
    } catch (error) {
      console.error('Error loading document:', error);
      // Set empty content on error so user can still write
      setContent('');
      setDocStartWordCount(0);
    } finally {
      setLoadingContent(false);
    }
  };

  const handleContentChange = useCallback((markdown: string) => {
    setContent(markdown);
    setSaveStatus('unsaved');
    
    // Debounce word count calculation slightly to avoid blocking on every keystroke
    requestAnimationFrame(() => {
      const currentCount = calculateWordCount(markdown);
      setWordCount(currentCount);
    });
  }, []);
  
  // Words added in current document = current - where doc started
  // This allows deletions to reduce the count if you delete what you just wrote
  const currentDocWordsAdded = Math.max(0, wordCount - docStartWordCount);
  
  // Total words written today = where we started this session + words added in current doc
  const wordsWrittenToday = sessionStartWordCount + currentDocWordsAdded;

  // Auto-save writing session to Firestore (only when document is visible)
  useEffect(() => {
    // Don't save if no user or no words written today
    if (!session?.user?.email || wordsWrittenToday === 0) {
      return;
    }

    // Don't save if we've already saved this exact count
    if (wordsWrittenToday === lastSavedCount) {
      return;
    }

    // Only save if the document is visible (tab is active)
    if (document.hidden) {
      return;
    }

    // Save after delay when user stops typing
    const timeoutId = setTimeout(async () => {
      const today = toDateString(new Date());
      setSaveStatus('saving');
      try {
        await createOrUpdateWritingSession({
          userId: session.user.email!,
          date: today,
          wordCount: wordsWrittenToday, // Save total for the day
        });
        setLastSavedCount(wordsWrittenToday);
        setSessionStartWordCount(wordsWrittenToday);
        // Reset document baseline so we don't double-count these words
        setDocStartWordCount(wordCount);
        setSaveStatus('saved');
      } catch (error) {
        console.error('Failed to save writing session:', error);
        setSaveStatus('unsaved');
      }
    }, AUTO_SAVE_DELAY);

    return () => clearTimeout(timeoutId);
  }, [session?.user?.email, wordsWrittenToday, lastSavedCount, wordCount]);

  // Save when user leaves the page (switches tabs or closes browser)
  useEffect(() => {
    if (!session?.user?.email) return;

    const handleVisibilityChange = async () => {
      // Save immediately when tab becomes hidden (only if there are unsaved changes)
      if (document.hidden && wordsWrittenToday > 0 && wordsWrittenToday !== lastSavedCount) {
        const today = toDateString(new Date());
        setSaveStatus('saving');
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
          setSaveStatus('saved');
        } catch (error) {
          console.error('Failed to save on visibility change:', error);
          setSaveStatus('unsaved');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [session?.user?.email, wordsWrittenToday, lastSavedCount, wordCount]);

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
    <main className="h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950 strawberry:bg-linear-to-br strawberry:from-pink-50 strawberry:via-rose-50 strawberry:to-pink-100 cherry:bg-linear-to-br cherry:from-zinc-950 cherry:via-rose-950 cherry:to-zinc-950 seafoam:bg-linear-to-br seafoam:from-cyan-50 seafoam:via-blue-50 seafoam:to-cyan-100 ocean:bg-linear-to-br ocean:from-zinc-950 ocean:via-cyan-950 ocean:to-zinc-950">
      <div className="mx-auto flex h-full max-w-5xl flex-col px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          title="Write"
          description="Start your daily writing session"
          dailyGoal={todayGoal}
          daysLeft={daysLeft}
          writtenToday={wordsWrittenToday}
          goalStartDate={currentGoal?.startDate}
          goalEndDate={currentGoal?.endDate}
          showNewGoalButton={false}
          showWriteButton={false}
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

        {/* Selected Document Info */}
        {selectedDoc && !showPicker && (
          <Card className="mb-6 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 strawberry:text-rose-600 cherry:text-rose-400 seafoam:text-cyan-600 ocean:text-cyan-400">
                  Writing in:
                </p>
                <h3 className="font-semibold text-gray-900 dark:text-white strawberry:text-rose-900 cherry:text-rose-100 seafoam:text-cyan-900 ocean:text-cyan-100">
                  {selectedDoc.name}
                </h3>
              </div>
              <button
                onClick={() => setShowPicker(true)}
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 strawberry:text-rose-600 strawberry:hover:text-rose-700 cherry:text-rose-400 cherry:hover:text-rose-300 seafoam:text-cyan-600 seafoam:hover:text-cyan-700 ocean:text-cyan-400 ocean:hover:text-cyan-300"
                aria-label="Change selected document"
              >
                Change Document
              </button>
            </div>
          </Card>
        )}

        {/* Markdown Editor */}
        {selectedDoc && !showPicker && (
          <Card className="flex flex-1 flex-col overflow-hidden">
            {loadingContent ? (
              <div className="flex items-center justify-center p-12" role="status" aria-live="polite">
                <p className="text-gray-600 dark:text-gray-400 strawberry:text-rose-600 cherry:text-rose-400 seafoam:text-cyan-600 ocean:text-cyan-400">
                  Loading document content...
                </p>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto">
                  <MarkdownEditor
                    markdown={content}
                    onChange={handleContentChange}
                    placeholder="Start writing..."
                  />
                </div>
                <div className="flex items-center justify-between border-t border-zinc-200 p-4 dark:border-zinc-800 strawberry:border-pink-200 cherry:border-rose-900 seafoam:border-cyan-200 ocean:border-cyan-900">
                  <div className="flex gap-4 text-sm text-zinc-600 dark:text-zinc-400 strawberry:text-rose-700 cherry:text-rose-400 seafoam:text-cyan-700 ocean:text-cyan-400">
                    <div>
                      <span className="font-semibold">{wordsWrittenToday}</span> words written today
                    </div>
                    <div className="text-zinc-400 dark:text-zinc-600 strawberry:text-rose-500 cherry:text-rose-600 seafoam:text-cyan-500 ocean:text-cyan-600">
                      {wordCount} total words
                    </div>
                  </div>
                  <div 
                    className="text-xs text-zinc-500 dark:text-zinc-500 strawberry:text-rose-600 cherry:text-rose-500 seafoam:text-cyan-600 ocean:text-cyan-500"
                    role="status"
                    aria-live="polite"
                    aria-atomic="true"
                  >
                    {saveStatus === 'saving' && 'Saving...'}
                    {saveStatus === 'saved' && 'Saved'}
                    {saveStatus === 'unsaved' && 'Unsaved changes'}
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
