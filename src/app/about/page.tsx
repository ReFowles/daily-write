"use client";

import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/PageHeader";
import { useCurrentGoal } from "@/lib/use-current-goal";

export default function AboutPage() {
  const { todayGoal, todayProgress, daysLeft, currentGoal } = useCurrentGoal();

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 strawberry:bg-linear-to-br strawberry:from-pink-50 strawberry:via-rose-50 strawberry:to-pink-100 cherry:bg-linear-to-br cherry:from-zinc-950 cherry:via-rose-950 cherry:to-zinc-950 seafoam:bg-linear-to-br seafoam:from-cyan-50 seafoam:via-blue-50 seafoam:to-cyan-100 ocean:bg-linear-to-br ocean:from-zinc-950 ocean:via-cyan-950 ocean:to-zinc-950">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <PageHeader
          title="About DailyWrite"
          description="Learn about DailyWrite's features and functionality"
          dailyGoal={todayGoal}
          daysLeft={daysLeft}
          writtenToday={todayProgress}
          goalStartDate={currentGoal?.startDate}
          goalEndDate={currentGoal?.endDate}
        />

        <div className="mt-8 columns-1 gap-6 space-y-6 lg:columns-2">
          {/* Purpose */}
          <Card className="mb-6 break-inside-avoid p-6">
            <h2 className="mb-4 text-2xl font-bold text-zinc-900 dark:text-zinc-100 strawberry:text-rose-900 cherry:text-rose-100 seafoam:text-cyan-900 ocean:text-cyan-100">
              Purpose
            </h2>
            <p className="text-lg leading-relaxed text-zinc-700 dark:text-zinc-300 strawberry:text-rose-800 cherry:text-rose-200 seafoam:text-cyan-800 ocean:text-cyan-200">
              DailyWrite helps you build and maintain a consistent writing habit by tracking your
              daily progress toward word count goals.
            </p>
          </Card>

          {/* Google Docs Integration */}
          <Card className="mb-6 break-inside-avoid p-6">
            <h2 className="mb-4 text-2xl font-bold text-zinc-900 dark:text-zinc-100 strawberry:text-rose-900 cherry:text-rose-100 seafoam:text-cyan-900 ocean:text-cyan-100">
              Google Docs Integration
            </h2>
            <div className="space-y-4 text-lg leading-relaxed text-zinc-700 dark:text-zinc-300 strawberry:text-rose-800 cherry:text-rose-200 seafoam:text-cyan-800 ocean:text-cyan-200">
              <p>
                DailyWrite is seamlessly integrated with Google Docs, allowing you to write
                directly in your Google Drive account. You can:
              </p>
              <ul className="ml-6 list-disc space-y-2">
                <li>
                  <strong>Create new documents</strong> that are automatically saved to your Google
                  Drive
                </li>
                <li>
                  <strong>Access recently modified documents</strong> to continue where you left
                  off
                </li>
                <li>
                  <strong>Sync your work automatically</strong> as you write, ensuring nothing is
                  lost
                </li>
              </ul>
              <p className="mt-4">
                All your writing is stored in your own Google Drive, giving you full ownership and
                access to your work from anywhere.
              </p>
            </div>
          </Card>

          {/* Privacy & Data Storage */}
          <Card className="mb-6 break-inside-avoid p-6">
            <h2 className="mb-4 text-2xl font-bold text-zinc-900 dark:text-zinc-100 strawberry:text-rose-900 cherry:text-rose-100 seafoam:text-cyan-900 ocean:text-cyan-100">
              Privacy &amp; Data Storage
            </h2>
            <div className="space-y-4 text-lg leading-relaxed text-zinc-700 dark:text-zinc-300 strawberry:text-rose-800 cherry:text-rose-200 seafoam:text-cyan-800 ocean:text-cyan-200">
              <p>
                <strong>DailyWrite does not save or store your writing content.</strong> The app
                only tracks your writing goals and word count statistics. All of your actual
                writing is saved exclusively to your Google Drive account.
              </p>
              <p>
                <strong>What DailyWrite stores:</strong>
              </p>
              <ul className="ml-6 list-disc space-y-2">
                <li>Your writing goals (daily targets, start/end dates)</li>
                <li>Daily word count totals</li>
                <li>Progress statistics and historical data</li>
              </ul>
              <p className="mt-4">
                <strong>What DailyWrite does NOT store:</strong>
              </p>
              <ul className="ml-6 list-disc space-y-2">
                <li>Your writing content or text</li>
                <li>Document titles or file names</li>
                <li>Any personal information beyond what&apos;s needed for authentication (i.e. your email address)</li>
              </ul>
              <p className="mt-4">
                Your privacy is important. DailyWrite is designed to be a tracking tool, not a
                content repository. Everything you write lives in your Google Drive where you have
                full control over your data.
              </p>
            </div>
          </Card>

          {/* Writing Experience */}
          <Card className="mb-6 break-inside-avoid p-6">
            <h2 className="mb-4 text-2xl font-bold text-zinc-900 dark:text-zinc-100 strawberry:text-rose-900 cherry:text-rose-100 seafoam:text-cyan-900 ocean:text-cyan-100">
              Writing Experience
            </h2>
            <div className="space-y-4 text-lg leading-relaxed text-zinc-700 dark:text-zinc-300 strawberry:text-rose-800 cherry:text-rose-200 seafoam:text-cyan-800 ocean:text-cyan-200">
              <p>
                The in-app writing interface is designed for distraction-free writing with real-time
                word count tracking. However, <strong>formatting options are limited</strong> while
                writing within DailyWrite.
              </p>
              <p>
                For advanced formatting, editing, and document management, you can always open your
                documents directly in Google Docs where you&apos;ll have access to the full suite of
                formatting tools, comments, version history, and collaboration features.
              </p>
            </div>
          </Card>

          {/* How Word Counting Works */}
          <Card className="mb-6 break-inside-avoid p-6">
            <h2 className="mb-4 text-2xl font-bold text-zinc-900 dark:text-zinc-100 strawberry:text-rose-900 cherry:text-rose-100 seafoam:text-cyan-900 ocean:text-cyan-100">
              How Word Counting Works
            </h2>
            <div className="space-y-4 text-lg leading-relaxed text-zinc-700 dark:text-zinc-300 strawberry:text-rose-800 cherry:text-rose-200 seafoam:text-cyan-800 ocean:text-cyan-200">
              <p>
                DailyWrite tracks <strong>net new words added each day</strong> by measuring the
                change in your document&apos;s word count during your writing sessions. The app counts
                words added across all documents you work on throughout the day.
              </p>
              <p>
                <strong>Important limitations to be aware of:</strong>
              </p>
              <ul className="ml-6 list-disc space-y-2">
                <li>
                  <strong>Pasted content is counted</strong> — The app cannot distinguish between
                  words you type and words you paste. If you paste existing text, it will be counted
                  as words written.
                </li>
                <li>
                  <strong>Deletions lower the baseline</strong> — If you delete paragraphs and then
                  write new content, only the net increase from the lowest word count is tracked.
                </li>
                <li>
                  <strong>Session-based tracking</strong> — Word counts accumulate throughout the
                  calendar day, persisting across different documents and browser sessions.
                </li>
              </ul>
              <p className="mt-4 font-semibold">
                DailyWrite is a tool for self-improvement and relies on honest usage. The word count
                tracking is designed to help you build a consistent writing habit, not to be gamed
                or circumvented.
              </p>
            </div>
          </Card>

          {/* Goal System */}
          <Card className="mb-6 break-inside-avoid p-6">
            <h2 className="mb-4 text-2xl font-bold text-zinc-900 dark:text-zinc-100 strawberry:text-rose-900 cherry:text-rose-100 seafoam:text-cyan-900 ocean:text-cyan-100">
              Goal System
            </h2>
            <div className="space-y-4 text-lg leading-relaxed text-zinc-700 dark:text-zinc-300 strawberry:text-rose-800 cherry:text-rose-200 seafoam:text-cyan-800 ocean:text-cyan-200">
              <p>Set writing goals with specific:</p>
              <ul className="ml-6 list-disc space-y-2">
                <li>
                  <strong>Daily word count targets</strong> to keep you consistent
                </li>
                <li>
                  <strong>Start and end dates</strong> to track your progress over time
                </li>
                <li>
                  <strong>Visual progress indicators</strong> on your dashboard to stay motivated
                </li>
              </ul>
              <p className="mt-4">
                The calendar view shows your daily progress at a glance, making it easy to see your
                streaks and identify patterns in your writing habit.
              </p>
            </div>
          </Card>

          {/* Progressive Goals */}
          <Card className="mb-6 break-inside-avoid p-6">
            <h2 className="mb-4 text-2xl font-bold text-zinc-900 dark:text-zinc-100 strawberry:text-rose-900 cherry:text-rose-100 seafoam:text-cyan-900 ocean:text-cyan-100">
              Progressive Goals
            </h2>
            <div className="space-y-4 text-lg leading-relaxed text-zinc-700 dark:text-zinc-300 strawberry:text-rose-800 cherry:text-rose-200 seafoam:text-cyan-800 ocean:text-cyan-200">
              <p>
                When creating a new goal, DailyWrite will{" "}
                <strong>suggest a daily word count target</strong> based on your previous
                goal&apos;s performance. The suggestion encourages you to push just a little bit beyond
                your last goal&apos;s average, helping you build your writing capacity gradually over
                time.
              </p>
              <p>
                This intelligent suggestion system helps you set ambitious yet achievable targets
                that support sustainable growth in your writing practice.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
