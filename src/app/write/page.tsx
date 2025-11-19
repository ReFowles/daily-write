"use client";

import { useState } from "react";
import { WritingStatsHeader } from "@/components/writing-stats-header";
import { Card } from "@/components/ui/card";

export default function WritePage() {
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

  const todayGoal = 500; // Mock data - will be dynamic later

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 strawberry:bg-linear-to-br strawberry:from-pink-50 strawberry:via-rose-50 strawberry:to-pink-100 dark-strawberry:bg-linear-to-br dark-strawberry:from-zinc-950 dark-strawberry:via-rose-950 dark-strawberry:to-zinc-950 ocean:bg-linear-to-br ocean:from-cyan-50 ocean:via-blue-50 ocean:to-cyan-100 dark-ocean:bg-linear-to-br dark-ocean:from-zinc-950 dark-ocean:via-cyan-950 dark-ocean:to-zinc-950">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header with Stats */}
        <div className="mb-6">
          <WritingStatsHeader
            wordCount={wordCount}
            goal={todayGoal}
            onSave={handleSave}
            isSaving={isSaving}
            disabled={!title && !content}
          />
        </div>

        {/* Writing Area */}
        <Card>
          <div className="border-b border-zinc-200 p-4 dark:border-zinc-800 strawberry:border-pink-200 dark-strawberry:border-rose-900 ocean:border-cyan-200 dark-ocean:border-cyan-900">
            <input
              type="text"
              placeholder="Title your writing session..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border-none bg-transparent text-2xl font-semibold text-zinc-900 placeholder-zinc-400 focus:outline-none dark:text-zinc-50 dark:placeholder-zinc-600 strawberry:text-rose-900 strawberry:placeholder-rose-400 dark-strawberry:text-rose-300 dark-strawberry:placeholder-rose-600 ocean:text-cyan-900 ocean:placeholder-cyan-400 dark-ocean:text-cyan-300 dark-ocean:placeholder-cyan-600"
            />
          </div>
          <div className="p-4">
            <textarea
              placeholder="Start writing..."
              value={content}
              onChange={handleContentChange}
              className="min-h-[calc(100vh-400px)] w-full resize-none border-none bg-transparent text-lg text-zinc-900 placeholder-zinc-400 focus:outline-none dark:text-zinc-50 dark:placeholder-zinc-600 strawberry:text-rose-900 strawberry:placeholder-rose-400 dark-strawberry:text-rose-300 dark-strawberry:placeholder-rose-600 ocean:text-cyan-900 ocean:placeholder-cyan-400 dark-ocean:text-cyan-300 dark-ocean:placeholder-cyan-600"
              autoFocus
            />
          </div>
        </Card>

        {/* Tips */}
        <div className="mt-6 rounded-lg border border-zinc-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950 strawberry:border-pink-300 strawberry:bg-pink-100 dark-strawberry:border-rose-900 dark-strawberry:bg-rose-950/50 ocean:border-cyan-300 ocean:bg-cyan-100 dark-ocean:border-cyan-900 dark-ocean:bg-cyan-950/50">
          <p className="text-sm text-blue-900 dark:text-blue-100 strawberry:text-rose-900 dark-strawberry:text-rose-300 ocean:text-cyan-900 dark-ocean:text-cyan-300">
            <strong>Tip:</strong> In the future, this will sync with your Google Docs automatically!
          </p>
        </div>
      </div>
    </main>
  );
}
