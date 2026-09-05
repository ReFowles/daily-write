"use client";

import type { ReactNode } from "react";
import {
  LuArrowRight,
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
  LuDollarSign,
} from "react-icons/lu";
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
        {isSignedIn && (
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
        )}

        <div className={isSignedIn ? "mt-12" : undefined}>
          <Hero signInSlot={signInSlot} showCta={!isSignedIn} />
        </div>

        <HowItWorks className="mt-16 sm:mt-24" />

        <FeatureGrid className="mt-16 sm:mt-24" />

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

function Hero({ signInSlot, showCta }: { signInSlot: ReactNode; showCta: boolean }) {
  return (
    <section className="relative isolate rounded-3xl border border-line bg-surface/60 px-6 py-14 mb-12 sm:mb-16 backdrop-blur-sm sm:px-12 sm:py-20">
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

        {showCta && (
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
        )}

        <dl className="mt-12 grid grid-cols-2 gap-4 sm:mt-14 sm:grid-cols-4 sm:gap-6">
          <HeroStat label="Setup time" value="< 1 min" />
          <HeroStat label="Content stored" value="0 bytes" />
          <HeroStat label="Themes" value="10" />
          <HeroStat label="Price" value="Free" />
        </dl>
      </div>
    </section>
  );
}

function HeroBlobs() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-3xl">
      <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-accent/25 blur-3xl" />
      <div className="absolute -right-24 top-1/3 h-80 w-80 rounded-full bg-accent-ring/25 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-accent-subtle/40 blur-3xl" />
    </div>
  );
}

function GradientText({ children }: { children: ReactNode }) {
  return (
    <span className="accent-fill bg-clip-text text-transparent">
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
    body: "Choose a goal type and set your timeline. See your progress at a glance.",
  },
  {
    icon: <LuFileText className="h-6 w-6" aria-hidden />,
    title: "YOUR Google Docs",
    body: "Pick a theme to suit your mood, then write in DailyWrite to and from your own Google Drive.",
  },
  {
    icon: <LuShieldCheck className="h-6 w-6" aria-hidden />,
    title: "Your words stay yours",
    body: "We store goals and word counts—never document contents. You own the writing. Always.",
  },
  {
    icon: <LuDollarSign className="h-6 w-6" aria-hidden />,
    title: "Don't break the bank",
    body: "DailyWrite is completely free to use. No hidden fees, no subscriptions.",
  },
];

function FeatureGrid({ className }: { className?: string }) {
  return (
    <section className={className}>
      <SectionEyebrow>Features</SectionEyebrow>
      <SectionTitle>Everything you need. Nothing you don&apos;t.</SectionTitle>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((feature) => (
          <FeatureCard key={feature.title} {...feature} />
        ))}
      </div>
    </section>
  );
}

function FeatureCard({ icon, title, body }: Feature) {
  return (
    <Card className="group h-full p-6 transition-[transform,box-shadow] hover:-translate-y-1 hover:shadow-lg">
      <div
        className={cn(
          "inline-flex h-11 w-11 items-center justify-center rounded-lg transition-transform group-hover:scale-110",
          "bg-accent-subtle text-accent-subtle-fg"
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
    body: "Sign in, pick a goal type, set a timeline. That's it.",
  },
  {
    icon: <LuFeather className="h-5 w-5" aria-hidden />,
    title: "Write your story",
    body: "Open or create a new Google Doc from inside DailyWrite and get into the groove.",
  },
  {
    icon: <LuTrendingUp className="h-5 w-5" aria-hidden />,
    title: "Watch the streak grow",
    body: "Your dashboard shows you everything you need to know, right where you need it.",
  },
] as const;

function HowItWorks({ className }: { className?: string }) {
  return (
    <section id="how-it-works" className={className}>
      <SectionEyebrow>How it works</SectionEyebrow>
      <SectionTitle>Three steps. Because of course.</SectionTitle>
      <ol className="mt-8 grid gap-4 md:grid-cols-3">
        {STEPS.map((step, i) => (
          <li key={step.title} className="h-full">
            <Card className="relative h-full p-6">
              <div
                className={cn(
                  "absolute -top-3 -left-3 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold shadow-md",
                  "accent-fill"
                )}
                aria-hidden
              >
                {i + 1}
              </div>
              <div
                className={cn(
                  "inline-flex h-10 w-10 items-center justify-center rounded-lg",
                  "bg-accent-subtle text-accent-subtle-fg"
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

interface ThemePair {
  family: string;
  light: ThemeSwatch;
  dark: ThemeSwatch;
}

const THEME_PAIRS: ReadonlyArray<ThemePair> = [
  {
    family: "Neutral",
    light: { value: "light", label: "Light", kind: "light", swatches: ["#ffffff", "#e4e4e7", "#2563eb"] },
    dark: { value: "dark", label: "Dark", kind: "dark", swatches: ["#0a0a0a", "#27272a", "#60a5fa"] },
  },
  {
    family: "Berry",
    light: { value: "strawberry", label: "Strawberry", kind: "light", swatches: ["#fff1f2", "#fecdd3", "#e11d48"] },
    dark: { value: "cherry", label: "Cherry", kind: "dark", swatches: ["#1f1013", "#4c0519", "#fb7185"] },
  },
  {
    family: "Water",
    light: { value: "seafoam", label: "Seafoam", kind: "light", swatches: ["#ecfeff", "#a5f3fc", "#0891b2"] },
    dark: { value: "ocean", label: "Ocean", kind: "dark", swatches: ["#0f172a", "#1e3a8a", "#60a5fa"] },
  },
  {
    family: "Sky",
    light: { value: "sunrise", label: "Sunrise", kind: "light", swatches: ["#ffedd5", "#fbcfe8", "#0ea5e9"] },
    dark: { value: "sunset", label: "Sunset", kind: "dark", swatches: ["#7c2d12", "#9d174d", "#818cf8"] },
  },
  {
    family: "Rainbow",
    light: {
      value: "energy",
      label: "Energy",
      kind: "light",
      swatches: [
        "#ffffff",
        "linear-gradient(135deg, #ef4444, #f97316, #eab308, #22c55e, #06b6d4, #3b82f6, #a855f7)",
        "#2563eb",
      ],
    },
    dark: {
      value: "ambition",
      label: "Ambition",
      kind: "dark",
      swatches: [
        "#0a0a0a",
        "linear-gradient(135deg, #ef4444, #f97316, #eab308, #22c55e, #06b6d4, #3b82f6, #a855f7)",
        "#60a5fa",
      ],
    },
  },
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
      <SectionTitle>Pick a mood. Or ten.</SectionTitle>
      <p className={cn("mt-3 max-w-2xl text-base sm:text-lg", themeClasses.text.secondary)}>
        Never tied down to one boring style—tap one to try now and change from the menu anytime.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-2 xl:grid-cols-3">
        {THEME_PAIRS.map((pair) => (
          <div
            key={pair.family}
            className={cn(
              "flex rounded-xl border",
              themeClasses.background.card,
              themeClasses.border.card
            )}
            aria-label={`${pair.family} theme pair`}
          >
            <ThemeSwatchButton
              theme={pair.light}
              isActive={current === pair.light.value}
              onSelect={() => applyTheme(pair.light.value)}
              className="rounded-l-xl"
            />
            <div className={cn("w-px shrink-0", themeClasses.border.card, "border-l")} aria-hidden />
            <ThemeSwatchButton
              theme={pair.dark}
              isActive={current === pair.dark.value}
              onSelect={() => applyTheme(pair.dark.value)}
              className="rounded-r-xl"
            />
          </div>
        ))}
      </div>
    </section>
  );
}

function ThemeSwatchButton({
  theme,
  isActive,
  onSelect,
  className,
}: {
  theme: ThemeSwatch;
  isActive: boolean;
  onSelect: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isActive}
      aria-label={`Apply ${theme.label} theme`}
      className={cn(
        "group flex flex-1 items-center gap-3 p-4 text-left transition-colors",
        isActive ? "bg-accent-ring/10" : "hover:bg-accent-ring/5",
        className
      )}
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center overflow-hidden rounded-md border border-line shadow-inner"
        aria-hidden
      >
        {theme.swatches.map((color) => (
          <div key={color} className="h-full flex-1" style={{ background: color }} />
        ))}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {theme.kind === "light" ? (
            <LuSun className={cn("h-3.5 w-3.5", themeClasses.text.tertiary)} aria-hidden />
          ) : (
            <LuMoon className={cn("h-3.5 w-3.5", themeClasses.text.tertiary)} aria-hidden />
          )}
          <span className={cn("truncate text-sm font-semibold", themeClasses.text.primary)}>
            {theme.label}
          </span>
        </div>
        <div className={cn("truncate text-[11px]", themeClasses.text.tertiary)}>
          {isActive ? "Currently active" : "Click to apply"}
        </div>
      </div>
    </button>
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
              <strong>All deletions subtract.</strong> Whether one at a time or en masse, deleting 
              words drops your count, even words written on different days.
            </li>
          </ul>
          <p className="mt-4 font-medium">
            DailyWrite is an imperfect tool optimized for writing prose and self-improvement. It&apos;s 
            not as robust as a full-fledged word processor, and only works if you write in good faith.
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
            "bg-accent-subtle text-accent-subtle-fg"
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
      ? "bg-green-500 dark:bg-green-400"
      : "bg-fg-faint";
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
          Not currently. Once a goal is created, its target and dates are locked in. You can delete
          it and start over, but you can&apos;t change it in place. This keeps historical progress
          honest and prevents accidental (or dishonest) target-tweaking mid-run.
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
        write in, but creating and removing tabs can only happen inside Google Docs.
      </p>
    ),
  },
  {
    q: "Does DailyWrite ever store my writing?",
    a: (
      <p>
        No. Only word counts, goals, and timestamps are stored. Every character you write lives in
        your Google Drive. If you ever abandon DailyWrite, your writing will still be accessible there.
      </p>
    ),
  },
  {
    q: "Why does Google warn that this app isn't verified?",
    a: (
      <p>
        DailyWrite requests Google Drive and Docs access, which Google classifies as sensitive.
        Full verification requires a paid security review that isn&apos;t worth it yet for a small
        app, so you&apos;ll see a &quot;Google hasn&apos;t verified this app&quot; screen when
        signing in. Click <strong>Advanced</strong>, then{" "}
        <strong>Go to DailyWrite (unsafe)</strong> to continue—this is expected, and your data
        stays private to your own Google account.
      </p>
    ),
  },
  {
    q: "Can I request a new theme or feature?",
    a: (
      <p>
        Yes! DailyWrite is actively developed, and user feedback helps shape its future. 
        If you have a feature or theme request, please reach out through the official channels.
      </p>
    ),
  },
  {
    q: "I found a bug.",
    a: (
      <p>
        If you find a bug, please report it through the official channels so it can be 
        addressed promptly. Your feedback helps improve DailyWrite for everyone!
        Please note: due to the content retention policy, some bugs may not be fixable and
        are considered true limitations of the app.
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
        DailyWrite is intentionally small. Here&apos;s what it doesn&apos;t do. Yet.
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
        "relative isolate rounded-3xl border px-6 py-14 text-center sm:px-12 sm:py-20",
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
          gimmicks, and leave whenever you want.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {signInSlot}
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
        "text-accent"
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
