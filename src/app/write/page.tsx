"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/PageHeader";
import { useCurrentGoal } from "@/lib/use-current-goal";
import GoogleDocsPicker from "@/components/GoogleDocsPicker";
import dynamic from 'next/dynamic';

const MarkdownEditor = dynamic(() => import('@/components/MarkdownEditor'), {
  ssr: false,
  loading: () => <div className="p-4 text-gray-500">Loading editor...</div>
});

interface GoogleDoc {
  id: string;
  name: string;
  modifiedTime: string;
  webViewLink: string;
  ownedByMe: boolean;
}

export default function WritePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { todayGoal, todayProgress, daysLeft, currentGoal } = useCurrentGoal();
  const [selectedDoc, setSelectedDoc] = useState<GoogleDoc | null>(null);
  const [showPicker, setShowPicker] = useState(true);
  const [content, setContent] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [loadingContent, setLoadingContent] = useState(false);

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
      setContent(data.markdown || '');
    } catch (error) {
      console.error('Error loading document:', error);
      // Set empty content on error so user can still write
      setContent('');
    } finally {
      setLoadingContent(false);
    }
  };

  const handleContentChange = useCallback((markdown: string) => {
    setContent(markdown);
    
    // Calculate word count from markdown (strip markdown syntax)
    const plainText = markdown
      .replace(/[#*_~`\[\]()]/g, '') // Remove markdown chars
      .replace(/!\[.*?\]\(.*?\)/g, '') // Remove images
      .replace(/\[.*?\]\(.*?\)/g, '') // Remove links
      .trim();
    
    const words = plainText.split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  }, []);

  // Redirect if not authenticated (after all hooks)
  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
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
          writtenToday={todayProgress}
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
              <div className="flex items-center justify-center p-12">
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
                  <div className="text-sm text-zinc-600 dark:text-zinc-400 strawberry:text-rose-700 cherry:text-rose-400 seafoam:text-cyan-700 ocean:text-cyan-400">
                    {wordCount} words
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
