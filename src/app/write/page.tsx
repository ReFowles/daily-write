"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/PageHeader";
import { useCurrentGoal } from "@/lib/use-current-goal";
import GoogleDocsPicker from "@/components/GoogleDocsPicker";

interface GoogleDoc {
  id: string;
  name: string;
  modifiedTime: string;
  webViewLink: string;
}

export default function WritePage() {
  const { todayGoal, todayProgress, daysLeft, currentGoal } = useCurrentGoal();
  const [selectedDoc, setSelectedDoc] = useState<GoogleDoc | null>(null);
  const [showPicker, setShowPicker] = useState(true);

  const handleSelectDoc = (doc: GoogleDoc) => {
    setSelectedDoc(doc);
    setShowPicker(false);
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
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Writing in:
                </p>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {selectedDoc.name}
                </h3>
              </div>
              <button
                onClick={() => setShowPicker(true)}
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                Change Document
              </button>
            </div>
          </Card>
        )}
      </div>
    </main>
  );
}
