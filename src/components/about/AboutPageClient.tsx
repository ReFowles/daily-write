"use client";

import type { ReactNode } from "react";
import {
  LuArrowRight,
  LuCalendarDays,
  LuChevronDown,
  LuFeather,
  LuFileText,
  LuMoon,
  LuPalette,
  LuShieldCheck,
  LuSparkles,
  LuSun,
  LuTarget,
  LuTrendingUp,
} from "react-icons/lu";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/PageHeader";
import { useCurrentGoal } from "@/lib/use-current-goal";
import { themeClasses } from "@/lib/theme-utils";
import { cn } from "@/lib/class-utils";
import { useAppliedTheme, type Theme } from "@/lib/use-applied-theme";

interface AboutPageClientProps {
  isSignedIn: boolean;
  signInSlot: ReactNode;
}

export function AboutPageClient({ isSignedIn, signInSlot }: AboutPageClientProps) {
  const { todayGoal, todayProgress, daysLeft, currentGoal, isLoading } = useCurrentGoal();

  return (
    <main className={cn("min-h-screen", themeClasses.background.page)}>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        {isSignedIn ? (
          <PageHeader
            title="About"
            description="Learn about DailyWrite"
            dailyGoal={todayGoal}
            daysLeft={daysLeft}
            writtenToday={todayProgress}
            goalStartDate={currentGoal?.startDate}
            goalEndDate={currentGoal?.endDate}
            isLoading={isLoading}
          />
        ) : (
          <Hero signInSlot={signInSlot} />
        )}

        <FeatureGrid />

        <HowItWorks className="mt-16 sm:mt-24" />

        <ThemeShowcase className="mt-16 sm:mt-24" />

        <DeepDive className="mt-16 sm:mt-24" />

        <Limitations className="mt-16 sm:mt-24" />

        {!isSignedIn && <BottomCta className="mt-16 sm:mt-24" signInSlot={signInSlot} />}
      </div>
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/*  Hero                                                                       */
/* -------------------------------------------------------------------------- */

function Hero({ signInSlot }: { signInSlot: ReactNode }) {
  return (
    <section className="relative isolate overflow-hidden rounded-3xl border border-zinc-200/70 bg-white/60 px-6 py-14 mb-12 sm:mb-16 backdrop-blur-sm sm:px-12 sm:py-20 dark:border-zinc-800/70 dark:bg-zinc-900/40 strawberry:border-rose-200/70 strawberry:bg-white/60 cherry:border-rose-900/70 cherry:bg-rose-950/40 seafoam:border-cyan-200/70 seafoam:bg-white/60 ocean:border-cyan-900/70 ocean:bg-cyan-950/40">
      <HeroBlobs />
      <div className="relative">
        <div
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium",
            themeClasses.border.default,
            themeClasses.background.card,
            themeClasses.text.secondary
          )}
        >
          <LuSparkles className="h-3.5 w-3.5" aria-hidden />
          Write a little. Every day.
        </div>
        <h1
          className={cn(
            "mt-6 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-6xl",
            themeClasses.text.primary
          )}
        >
          Build a writing habit that <GradientText>actually sticks.</GradientText>
        </h1>
        <p className={cn("mt-6 max-w-2xl text-lg leading-relaxed sm:text-xl", themeClasses.text.secondary)}>
          DailyWrite tracks the words you write each day, straight from Google Docs, so you can
          focus on the story — not the spreadsheet.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          {signInSlot}
          <a
            href="#how-it-works"
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              themeClasses.text.link,
              "hover:underline"
            )}
          >
            See how it works
            <LuArrowRight className="h-4 w-4" aria-hidden />
          </a>
        </div>

        <dl className="mt-12 grid grid-cols-2 gap-4 sm:mt-14 sm:grid-cols-4 sm:gap-6">
          <HeroStat label="Themes" value="6" />
          <HeroStat label="Content stored" value="0 bytes" />
          <HeroStat label="Setup time" value="< 1 min" />
          <HeroStat label="Locked In?" value="Nope!" />
        </dl>
      </div>
    </section>
  );
}

function HeroBlobs() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl dark:bg-blue-500/20 strawberry:bg-rose-400/30 cherry:bg-rose-500/25 seafoam:bg-cyan-400/30 ocean:bg-cyan-500/25" />
      <div className="absolute -right-24 top-1/3 h-80 w-80 rounded-full bg-purple-400/20 blur-3xl dark:bg-purple-500/20 strawberry:bg-pink-400/30 cherry:bg-pink-500/25 seafoam:bg-blue-400/30 ocean:bg-blue-500/25" />
      <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-teal-400/20 blur-3xl dark:bg-teal-500/20 strawberry:bg-orange-300/30 cherry:bg-orange-500/20 seafoam:bg-emerald-400/30 ocean:bg-teal-500/25" />
    </div>
  );
}

function GradientText({ children }: { children: ReactNode }) {
  return (
    <span className="bg-linear-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 strawberry:from-rose-600 strawberry:via-pink-500 strawberry:to-orange-500 cherry:from-rose-400 cherry:via-pink-400 cherry:to-orange-400 seafoam:from-cyan-600 seafoam:via-teal-500 seafoam:to-blue-500 ocean:from-cyan-400 ocean:via-teal-400 ocean:to-blue-400">
      {children}
    </span>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className={cn("text-xs uppercase tracking-wider", themeClasses.text.tertiary)}>{label}</dt>
      <dd className={cn("mt-1 text-2xl font-bold sm:text-3xl", themeClasses.text.primary)}>{value}</dd>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Features                                                                   */
/* -------------------------------------------------------------------------- */

interface Feature {
  icon: ReactNode;
  title: string;
  body: string;
}

const FEATURES: ReadonlyArray<Feature> = [
  {
    icon: <LuTarget className="h-6 w-6" aria-hidden />,
    title: "Daily word goals",
    body: "Set a daily target and a deadline. DailyWrite counts every word toward your goal automatically.",
  },
  {
    icon: <LuCalendarDays className="h-6 w-6" aria-hidden />,
    title: "Streak-friendly calendar",
    body: "Monthly and weekly views make it obvious when you're on a roll — and gently honest when you're not.",
  },
  {
    icon: <LuFileText className="h-6 w-6" aria-hidden />,
    title: "Google Docs, native",
    body: "Write in your own Google Drive. DailyWrite reads the word count and stays out of your way.",
  },
  {
    icon: <LuShieldCheck className="h-6 w-6" aria-hidden />,
    title: "Your words stay yours",
    body: "We store goals and word counts — never document contents. You own the writing. Always.",
  },
];

function FeatureGrid({ className }: { className?: string }) {
  return (
    <section className={className}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((feature) => (
          <FeatureCard key={feature.title} {...feature} />
        ))}
      </div>
    </section>
  );
}

function FeatureCard({ icon, title, body }: Feature) {
  return (
    <Card className="group h-full p-6 transition-all hover:-translate-y-1 hover:shadow-lg">
      <div
        className={cn(
          "inline-flex h-11 w-11 items-center justify-center rounded-lg transition-transform group-hover:scale-110",
          "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 strawberry:bg-rose-100 strawberry:text-rose-700 cherry:bg-rose-900 cherry:text-rose-200 seafoam:bg-cyan-100 seafoam:text-cyan-700 ocean:bg-cyan-900 ocean:text-cyan-200"
        )}
      >
        {icon}
      </div>
      <h3 className={cn("mt-4 text-lg font-semibold", themeClasses.text.primary)}>{title}</h3>
      <p className={cn("mt-2 text-sm leading-relaxed", themeClasses.text.secondary)}>{body}</p>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*  How it works                                                               */
/* -------------------------------------------------------------------------- */

const STEPS = [
  {
    icon: <LuTarget className="h-5 w-5" aria-hidden />,
    title: "Set a goal",
    body: "Pick a daily word target and an end date. That's it — no wizards, no fluff.",
  },
  {
    icon: <LuFeather className="h-5 w-5" aria-hidden />,
    title: "Write in Google Docs",
    body: "Open a doc from inside DailyWrite or bring your own. Write like you normally would.",
  },
  {
    icon: <LuTrendingUp className="h-5 w-5" aria-hidden />,
    title: "Watch the streak grow",
    body: "Your dashboard shows today's progress, the current streak, and how many days you have left.",
  },
] as const;

function HowItWorks({ className }: { className?: string }) {
  return (
    <section id="how-it-works" className={className}>
      <SectionEyebrow>How it works</SectionEyebrow>
      <SectionTitle>Three steps. No spreadsheet.</SectionTitle>
      <ol className="mt-8 grid gap-4 md:grid-cols-3">
        {STEPS.map((step, i) => (
          <li key={step.title} className="h-full">
            <Card className="relative h-full p-6">
              <div
                className={cn(
                  "absolute -top-3 -left-3 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold shadow-md",
                  "bg-blue-600 text-white strawberry:bg-rose-500 cherry:bg-rose-600 seafoam:bg-cyan-600 ocean:bg-cyan-600"
                )}
                aria-hidden
              >
                {i + 1}
              </div>
              <div
                className={cn(
                  "inline-flex h-10 w-10 items-center justify-center rounded-lg",
                  "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 strawberry:bg-rose-100 strawberry:text-rose-700 cherry:bg-rose-900 cherry:text-rose-200 seafoam:bg-cyan-100 seafoam:text-cyan-700 ocean:bg-cyan-900 ocean:text-cyan-200"
                )}
              >
                {step.icon}
              </div>
              <h3 className={cn("mt-4 text-lg font-semibold", themeClasses.text.primary)}>
                {step.title}
              </h3>
              <p className={cn("mt-2 text-sm leading-relaxed", themeClasses.text.secondary)}>
                {step.body}
              </p>
            </Card>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Theme showcase                                                             */
/* -------------------------------------------------------------------------- */

interface ThemeSwatch {
  value: Theme;
  label: string;
  kind: "light" | "dark";
  swatches: [string, string, string];
}

const THEME_SWATCHES: ReadonlyArray<ThemeSwatch> = [
  { value: "light", label: "Light", kind: "light", swatches: ["#ffffff", "#e4e4e7", "#2563eb"] },
  { value: "dark", label: "Dark", kind: "dark", swatches: ["#0a0a0a", "#27272a", "#60a5fa"] },
  { value: "strawberry", label: "Strawberry", kind: "light", swatches: ["#fff1f2", "#fecdd3", "#e11d48"] },
  { value: "cherry", label: "Cherry", kind: "dark", swatches: ["#1f1013", "#4c0519", "#fb7185"] },
  { value: "seafoam", label: "Seafoam", kind: "light", swatches: ["#ecfeff", "#a5f3fc", "#0891b2"] },
  { value: "ocean", label: "Ocean", kind: "dark", swatches: ["#0a1013", "#083344", "#22d3ee"] },
];

function ThemeShowcase({ className }: { className?: string }) {
  const [current, applyTheme] = useAppliedTheme();

  return (
    <section className={className}>
      <SectionEyebrow>
        <span className="inline-flex items-center gap-1.5">
          <LuPalette className="h-3.5 w-3.5" aria-hidden /> Themes
        </span>
      </SectionEyebrow>
      <SectionTitle>Pick a mood. Or six.</SectionTitle>
      <p className={cn("mt-3 max-w-2xl text-base sm:text-lg", themeClasses.text.secondary)}>
        Tap a theme to try it now — the whole app will follow along. You can always switch again
        from the toolbar.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {THEME_SWATCHES.map((theme) => {
          const isActive = current === theme.value;
          return (
            <button
              key={theme.value}
              type="button"
              onClick={() => applyTheme(theme.value)}
              aria-pressed={isActive}
              aria-label={`Apply ${theme.label} theme`}
              className={cn(
                "group flex items-center gap-4 rounded-xl border p-4 text-left transition-all",
                themeClasses.background.card,
                isActive
                  ? "border-blue-500 shadow-md ring-2 ring-blue-500/40 dark:border-blue-400 dark:ring-blue-400/40 strawberry:border-rose-500 strawberry:ring-rose-500/40 cherry:border-rose-400 cherry:ring-rose-400/40 seafoam:border-cyan-500 seafoam:ring-cyan-500/40 ocean:border-cyan-400 ocean:ring-cyan-400/40"
                  : cn(themeClasses.border.card, "hover:-translate-y-0.5 hover:shadow-md")
              )}
            >
              <div
                className="flex h-14 w-14 shrink-0 items-center overflow-hidden rounded-lg border border-zinc-200/50 shadow-inner dark:border-zinc-700/50"
                aria-hidden
              >
                {theme.swatches.map((color) => (
                  <div key={color} className="h-full flex-1" style={{ backgroundColor: color }} />
                ))}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {theme.kind === "light" ? (
                    <LuSun className={cn("h-4 w-4", themeClasses.text.tertiary)} aria-hidden />
                  ) : (
                    <LuMoon className={cn("h-4 w-4", themeClasses.text.tertiary)} aria-hidden />
                  )}
                  <span className={cn("text-base font-semibold", themeClasses.text.primary)}>
                    {theme.label}
                  </span>
                </div>
                <div className={cn("text-xs", themeClasses.text.tertiary)}>
                  {isActive ? "Currently active" : "Click to apply"}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Deep dive cards                                                            */
/* -------------------------------------------------------------------------- */

function DeepDive({ className }: { className?: string }) {
  return (
    <section className={className}>
      <SectionEyebrow>The details</SectionEyebrow>
      <SectionTitle>Everything you might want to know.</SectionTitle>

      <div className="mt-8 columns-1 gap-6 space-y-6 lg:columns-2">
        <InfoCard title="Google Docs integration" icon={<LuFileText className="h-5 w-5" aria-hidden />}>
          <p>
            DailyWrite plugs directly into Google Docs, so you write inside the tool you already
            trust:
          </p>
          <ul className="ml-6 list-disc space-y-2">
            <li>
              <strong>Create new documents</strong> that live in your own Google Drive.
            </li>
            <li>
              <strong>Continue recent drafts</strong> — the picker surfaces your most recently
              edited docs first.
            </li>
            <li>
              <strong>Autosave as you type</strong>, so nothing goes missing between sessions.
            </li>
          </ul>
          <p className="mt-4">
            Everything stays in your Drive. If you ever stop using DailyWrite, your writing is
            already exactly where it needs to be.
          </p>
        </InfoCard>

        <InfoCard title="Privacy &amp; data storage" icon={<LuShieldCheck className="h-5 w-5" aria-hidden />}>
          <p>
            <strong>DailyWrite does not store your writing.</strong> Only goals and word count
            metadata live on our side.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <MiniList
              tone="positive"
              heading="What we store"
              items={[
                "Your goals (targets, start/end dates)",
                "Daily word count totals",
                "Progress statistics",
              ]}
            />
            <MiniList
              tone="negative"
              heading="What we don't"
              items={[
                "Your writing content",
                "Document titles or filenames",
                "Anything beyond your email for sign-in",
              ]}
            />
          </div>
        </InfoCard>

        <InfoCard title="How word counting works" icon={<LuTrendingUp className="h-5 w-5" aria-hidden />}>
          <p>
            DailyWrite tracks <strong>net new words per day</strong> by measuring the change in a
            document&apos;s word count while you write. Words added across every document you open
            during the day are combined.
          </p>
          <ul className="ml-6 list-disc space-y-2">
            <li>
              <strong>Pasted content counts.</strong> The app can&apos;t tell typing from pasting.
            </li>
            <li>
              <strong>Deletions lower the baseline.</strong> Only the net increase from your
              day&apos;s low-water mark is tracked.
            </li>
            <li>
              <strong>Day-scoped.</strong> Progress accumulates until midnight, across documents.
            </li>
          </ul>
          <p className="mt-4 font-medium">
            DailyWrite is a tool for self-improvement. It only works if you write in good faith.
          </p>
        </InfoCard>

        <InfoCard title="Writing experience" icon={<LuFeather className="h-5 w-5" aria-hidden />}>
          <p>
            The in-app editor is deliberately minimal — headings, lists, links, tables, and a live
            word count. It&apos;s enough to draft without getting lost in a toolbar.
          </p>
          <p className="mt-4">
            Need fancy formatting, comments, or version history? Open the document in Google Docs
            with a single click and the full suite is right there.
          </p>
        </InfoCard>

        <InfoCard title="Goals &amp; progressive targets" icon={<LuTarget className="h-5 w-5" aria-hidden />}>
          <p>Every goal has three ingredients:</p>
          <ul className="ml-6 list-disc space-y-2">
            <li>
              <strong>Daily word target</strong> — what to aim for each day.
            </li>
            <li>
              <strong>Start and end dates</strong> — the season you&apos;re writing in.
            </li>
            <li>
              <strong>Visual progress</strong> — cards, calendars, and streak counts on the
              dashboard.
            </li>
          </ul>
          <p className="mt-4">
            When you set your next goal, DailyWrite suggests a target based on your recent
            performance — a small nudge up from your last average, so you keep growing without
            burning out.
          </p>
        </InfoCard>
      </div>
    </section>
  );
}

function InfoCard({
  title,
  icon,
  children,
}: {
  title: ReactNode;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card className="mb-6 break-inside-avoid p-6">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "inline-flex h-9 w-9 items-center justify-center rounded-lg",
            "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 strawberry:bg-rose-100 strawberry:text-rose-700 cherry:bg-rose-900 cherry:text-rose-200 seafoam:bg-cyan-100 seafoam:text-cyan-700 ocean:bg-cyan-900 ocean:text-cyan-200"
          )}
        >
          {icon}
        </div>
        <h3 className={cn("text-xl font-bold sm:text-2xl", themeClasses.text.primary)}>{title}</h3>
      </div>
      <div
        className={cn(
          "mt-4 space-y-4 text-base leading-relaxed sm:text-lg",
          themeClasses.text.secondary
        )}
      >
        {children}
      </div>
    </Card>
  );
}

function MiniList({
  tone,
  heading,
  items,
}: {
  tone: "positive" | "negative";
  heading: string;
  items: readonly string[];
}) {
  const dotClass =
    tone === "positive"
      ? "bg-green-500 dark:bg-green-400 strawberry:bg-emerald-500 cherry:bg-emerald-400 seafoam:bg-emerald-500 ocean:bg-emerald-400"
      : "bg-zinc-400 dark:bg-zinc-500 strawberry:bg-rose-400 cherry:bg-rose-500 seafoam:bg-cyan-400 ocean:bg-cyan-500";
  return (
    <div
      className={cn(
        "rounded-lg border p-4",
        themeClasses.border.default,
        themeClasses.background.card
      )}
    >
      <div className={cn("text-xs font-semibold uppercase tracking-wider", themeClasses.text.tertiary)}>
        {heading}
      </div>
      <ul className="mt-2 space-y-1.5 text-sm">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2">
            <span className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", dotClass)} aria-hidden />
            <span className={themeClasses.text.secondary}>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Limitations FAQ                                                            */
/* -------------------------------------------------------------------------- */

const LIMITATIONS: ReadonlyArray<{ q: string; a: ReactNode }> = [
  {
    q: "Can I edit a goal after I create it?",
    a: (
      <>
        <p>
          Not currently. Once a goal is created, its target and dates are locked in — you can delete
          it and start over, but you can&apos;t change it in place. This keeps historical progress
          honest and prevents accidental target-tweaking mid-run.
        </p>
      </>
    ),
  },
  {
    q: "Can goals overlap?",
    a: (
      <p>
        No. Only one goal can be active on any given day. If you try to create a goal that would
        overlap with an existing one, DailyWrite will flag the conflict so you can resolve it before
        continuing.
      </p>
    ),
  },
  {
    q: "What kinds of goals can I set?",
    a: (
      <p>
        Today, DailyWrite supports one goal type: a daily word count target over a fixed date range.
        Project-based goals (finish a novel by a deadline, with an auto-recalculating daily target)
        are on the roadmap.
      </p>
    ),
  },
  {
    q: "Can I create or delete document tabs?",
    a: (
      <p>
        Document tabs are <strong>read-only</strong> inside DailyWrite. You can pick which tab to
        write in, but creating and removing tabs happens inside Google Docs itself — the app just
        follows along.
      </p>
    ),
  },
  {
    q: "Does DailyWrite ever store my writing?",
    a: (
      <p>
        No. Only word counts, goals, and timestamps are stored. Every character you write lives in
        your Google Drive. If you delete your DailyWrite account, your writing is untouched.
      </p>
    ),
  },
];

function Limitations({ className }: { className?: string }) {
  return (
    <section className={className}>
      <SectionEyebrow>Good to know</SectionEyebrow>
      <SectionTitle>Honest limitations, up front.</SectionTitle>
      <p className={cn("mt-3 max-w-2xl text-base sm:text-lg", themeClasses.text.secondary)}>
        DailyWrite is intentionally small. Here&apos;s what it doesn&apos;t do — yet.
      </p>

      <div className="mt-8 space-y-3">
        {LIMITATIONS.map((item) => (
          <FaqItem key={item.q} question={item.q}>
            {item.a}
          </FaqItem>
        ))}
      </div>
    </section>
  );
}

function FaqItem({ question, children }: { question: string; children: ReactNode }) {
  return (
    <details
      className={cn(
        "group rounded-xl border p-4 transition-colors [&_summary::-webkit-details-marker]:hidden",
        themeClasses.border.default,
        themeClasses.background.card,
        "open:shadow-md"
      )}
    >
      <summary
        className={cn(
          "flex cursor-pointer items-center justify-between gap-4 list-none text-left font-semibold",
          themeClasses.text.primary
        )}
      >
        <span>{question}</span>
        <LuChevronDown
          className={cn(
            "h-5 w-5 shrink-0 transition-transform group-open:rotate-180",
            themeClasses.text.secondary
          )}
          aria-hidden
        />
      </summary>
      <div
        className={cn(
          "mt-3 space-y-3 text-base leading-relaxed",
          themeClasses.text.secondary
        )}
      >
        {children}
      </div>
    </details>
  );
}

/* -------------------------------------------------------------------------- */
/*  Bottom CTA                                                                 */
/* -------------------------------------------------------------------------- */

function BottomCta({ className, signInSlot }: { className?: string; signInSlot: ReactNode }) {
  return (
    <section
      className={cn(
        "relative isolate overflow-hidden rounded-3xl border px-6 py-14 text-center sm:px-12 sm:py-20",
        themeClasses.border.default,
        themeClasses.background.card,
        className
      )}
    >
      <HeroBlobs />
      <div className="relative mx-auto max-w-2xl">
        <h2 className={cn("text-3xl font-extrabold sm:text-4xl", themeClasses.text.primary)}>
          Ready to write today?
        </h2>
        <p className={cn("mt-4 text-base sm:text-lg", themeClasses.text.secondary)}>
          Sign in with Google and set your first goal in under a minute. No credit card, no
          gimmicks, no lock-in.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {signInSlot}
          <Link
            href="/"
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium hover:underline",
              themeClasses.text.link
            )}
          >
            Take me to the dashboard
            <LuArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Shared section chrome                                                      */
/* -------------------------------------------------------------------------- */

function SectionEyebrow({ children }: { children: ReactNode }) {
  return (
    <div
      className={cn(
        "text-xs font-semibold uppercase tracking-[0.2em]",
        "text-blue-700 dark:text-blue-400 strawberry:text-rose-600 cherry:text-rose-300 seafoam:text-cyan-700 ocean:text-cyan-300"
      )}
    >
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className={cn("mt-2 text-3xl font-bold tracking-tight sm:text-4xl", themeClasses.text.primary)}>
      {children}
    </h2>
  );
}
