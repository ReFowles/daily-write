"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/PageHeader";
import { useCurrentGoal } from "@/lib/use-current-goal";

export default function WritePage() {
  const { todayGoal, todayProgress, daysLeft, currentGoal } = useCurrentGoal();
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setContent(text);
    
    // Calculate word count
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  };

  const handleSave = async () => {
    setIsSaving(true);
    // TODO: Implement save functionality
    // This will eventually save to your data store
    console.log("Saving:", { title, content, wordCount });
    
    // Simulate save delay
    setTimeout(() => {
      setIsSaving(false);
      alert("Writing session saved! (This is a placeholder)");
    }, 500);
  };

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 strawberry:bg-linear-to-br strawberry:from-pink-50 strawberry:via-rose-50 strawberry:to-pink-100 cherry:bg-linear-to-br cherry:from-zinc-950 cherry:via-rose-950 cherry:to-zinc-950 seafoam:bg-linear-to-br seafoam:from-cyan-50 seafoam:via-blue-50 seafoam:to-cyan-100 ocean:bg-linear-to-br ocean:from-zinc-950 ocean:via-cyan-950 ocean:to-zinc-950">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
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

        {/* Writing Area */}
        <Card>
          <div className="border-b border-zinc-200 p-4 dark:border-zinc-800 strawberry:border-pink-200 cherry:border-rose-900 seafoam:border-cyan-200 ocean:border-cyan-900">
            <input
              type="text"
              placeholder="Title your writing session..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border-none bg-transparent text-2xl font-semibold text-zinc-900 placeholder-zinc-400 focus:outline-none dark:text-zinc-50 dark:placeholder-zinc-600 strawberry:text-rose-900 strawberry:placeholder-rose-400 cherry:text-rose-300 cherry:placeholder-rose-600 seafoam:text-cyan-900 seafoam:placeholder-cyan-400 ocean:text-cyan-300 ocean:placeholder-cyan-600"
            />
          </div>
          <div className="p-4">
            <textarea
              placeholder="Start writing..."
              value={content}
              onChange={handleContentChange}
              className="min-h-[calc(100vh-400px)] w-full resize-none border-none bg-transparent text-lg text-zinc-900 placeholder-zinc-400 focus:outline-none dark:text-zinc-50 dark:placeholder-zinc-600 strawberry:text-rose-900 strawberry:placeholder-rose-400 cherry:text-rose-300 cherry:placeholder-rose-600 seafoam:text-cyan-900 seafoam:placeholder-cyan-400 ocean:text-cyan-300 ocean:placeholder-cyan-600"
              autoFocus
            />
          </div>
          <div className="flex items-center justify-between border-t border-zinc-200 p-4 dark:border-zinc-800 strawberry:border-pink-200 cherry:border-rose-900 seafoam:border-cyan-200 ocean:border-cyan-900">
            <div className="text-sm text-zinc-600 dark:text-zinc-400 strawberry:text-rose-700 cherry:text-rose-400 seafoam:text-cyan-700 ocean:text-cyan-400">
              {wordCount} words
            </div>
            <button
              onClick={handleSave}
              disabled={(!title && !content) || isSaving}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed strawberry:bg-linear-to-r strawberry:from-rose-500 strawberry:to-pink-500 strawberry:hover:from-rose-600 strawberry:hover:to-pink-600 cherry:bg-linear-to-r cherry:from-rose-700 cherry:to-pink-700 cherry:hover:from-rose-600 cherry:hover:to-pink-600 seafoam:bg-linear-to-r seafoam:from-cyan-500 seafoam:to-blue-500 seafoam:hover:from-cyan-600 seafoam:hover:to-blue-600 ocean:bg-linear-to-r ocean:from-cyan-700 ocean:to-blue-700 ocean:hover:from-cyan-600 ocean:hover:to-blue-600"
            >
              {isSaving ? "Saving..." : "Save Session"}
            </button>
          </div>
        </Card>

        {/* Tips */}
        <div className="mt-6 rounded-lg border border-zinc-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950 strawberry:border-pink-300 strawberry:bg-pink-100 cherry:border-rose-900 cherry:bg-rose-950/50 seafoam:border-cyan-300 seafoam:bg-cyan-100 ocean:border-cyan-900 ocean:bg-cyan-950/50">
          <p className="text-sm text-blue-900 dark:text-blue-100 strawberry:text-rose-900 cherry:text-rose-300 seafoam:text-cyan-900 ocean:text-cyan-300">
            <strong>Tip:</strong> In the future, this will sync with your Google Docs automatically!
          </p>
        </div>
      </div>
    </main>
  );
}
