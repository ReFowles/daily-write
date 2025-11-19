"use client";

import { useState } from "react";

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
  const progress = Math.min((wordCount / todayGoal) * 100, 100);

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 strawberry:bg-linear-to-br strawberry:from-pink-50 strawberry:via-rose-50 strawberry:to-pink-100 dark-strawberry:bg-linear-to-br dark-strawberry:from-zinc-950 dark-strawberry:via-rose-950 dark-strawberry:to-zinc-950 ocean:bg-linear-to-br ocean:from-cyan-50 ocean:via-cyan-100 ocean:to-cyan-200 dark-ocean:bg-linear-to-br dark-ocean:from-cyan-950 dark-ocean:via-cyan-950 dark-ocean:to-cyan-950">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header with Stats */}
        <div className="mb-6 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 strawberry:border-pink-200 strawberry:bg-white strawberry:shadow-sm strawberry:shadow-pink-100 dark-strawberry:border-rose-900 dark-strawberry:bg-rose-950/50 dark-strawberry:shadow-sm dark-strawberry:shadow-rose-950 ocean:border-cyan-200 ocean:bg-white ocean:shadow-sm ocean:shadow-cyan-100 dark-ocean:border-cyan-900 dark-ocean:bg-cyan-950/50 dark-ocean:shadow-sm dark-ocean:shadow-cyan-950">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400 strawberry:text-rose-600 dark-strawberry:text-rose-400 ocean:text-cyan-600 dark-ocean:text-cyan-400">
                  Word Count
                </div>
                <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 strawberry:text-rose-900 dark-strawberry:text-rose-300 ocean:text-cyan-900 dark-ocean:text-cyan-300">
                  {wordCount}
                </div>
              </div>
              <div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400 strawberry:text-rose-600 dark-strawberry:text-rose-400 ocean:text-cyan-600 dark-ocean:text-cyan-400">
                  Goal
                </div>
                <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 strawberry:text-rose-900 dark-strawberry:text-rose-300 ocean:text-cyan-900 dark-ocean:text-cyan-300">
                  {todayGoal}
                </div>
              </div>
              <div className="flex-1">
                <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-1 strawberry:text-rose-600 dark-strawberry:text-rose-400 ocean:text-cyan-600 dark-ocean:text-cyan-400">
                  Progress
                </div>
                <div className="h-2 w-48 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800 strawberry:bg-pink-200 dark-strawberry:bg-rose-900 ocean:bg-cyan-200 dark-ocean:bg-cyan-900">
                  <div
                    className="h-full bg-blue-600 transition-all duration-300 strawberry:bg-linear-to-r strawberry:from-rose-500 strawberry:to-pink-500 dark-strawberry:bg-linear-to-r dark-strawberry:from-rose-600 dark-strawberry:to-pink-600 ocean:bg-linear-to-r ocean:from-cyan-500 ocean:to-blue-500 dark-ocean:bg-linear-to-r dark-ocean:from-cyan-600 dark-ocean:to-blue-600"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={isSaving || (!title && !content)}
              className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed strawberry:bg-linear-to-r strawberry:from-rose-500 strawberry:to-pink-500 strawberry:hover:from-rose-600 strawberry:hover:to-pink-600 dark-strawberry:bg-linear-to-r dark-strawberry:from-rose-700 dark-strawberry:to-pink-700 dark-strawberry:hover:from-rose-600 dark-strawberry:hover:to-pink-600 ocean:bg-linear-to-r ocean:from-cyan-500 ocean:to-blue-500 ocean:hover:from-cyan-600 ocean:hover:to-blue-600 dark-ocean:bg-linear-to-r dark-ocean:from-cyan-700 dark-ocean:to-blue-700 dark-ocean:hover:from-cyan-600 dark-ocean:hover:to-blue-600"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        {/* Writing Area */}
        <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 strawberry:border-pink-200 strawberry:bg-white strawberry:shadow-sm strawberry:shadow-pink-100 dark-strawberry:border-rose-900 dark-strawberry:bg-rose-950/50 dark-strawberry:shadow-sm dark-strawberry:shadow-rose-950 ocean:border-cyan-200 ocean:bg-white ocean:shadow-sm ocean:shadow-cyan-100 dark-ocean:border-cyan-900 dark-ocean:bg-cyan-950/50 dark-ocean:shadow-sm dark-ocean:shadow-cyan-950">
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
        </div>

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
