import { StatsCard } from "@/components/StatsCard";
import { ProgressCard } from "@/components/ProgressCard";
import { WeeklyCalendar } from "@/components/WeeklyCalendar";
import { PageHeader } from "@/components/PageHeader";
import { WritingSession } from "@/lib/date-utils";
import { useCurrentGoal } from "@/lib/use-current-goal";
import dummyData from "@/lib/dummy-data.json";

export default function Dashboard() {
  const { todayGoal, todayProgress, daysLeft, currentGoal } = useCurrentGoal();

  // Get today's date
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Calculate total words
  const totalWords = dummyData.writingSessions.reduce(
    (sum, session) => sum + session.wordCount,
    0
  );

  // Calculate total days written (sessions with word count > 0)
  const totalDaysWritten = dummyData.writingSessions.filter(
    (session) => session.wordCount > 0
  ).length;

  // Calculate average words per day
  const averageWordsPerDay =
    totalDaysWritten > 0 ? Math.round(totalWords / totalDaysWritten) : 0;

  // Calculate current streak (consecutive days with writing, going backwards from today)
  let streak = 0;
  const checkDate = new Date(today);
  while (true) {
    const dateString = checkDate.toISOString().split("T")[0];
    const session = dummyData.writingSessions.find(
      (s) => s.date === dateString
    );

    if (session && session.wordCount > 0) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  // Use all writing sessions from dummy data for the calendar
  const writingSessions: WritingSession[] = dummyData.writingSessions;

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 strawberry:bg-linear-to-br strawberry:from-pink-50 strawberry:via-rose-50 strawberry:to-pink-100 cherry:bg-linear-to-br cherry:from-zinc-950 cherry:via-rose-950 cherry:to-zinc-950 seafoam:bg-linear-to-br seafoam:from-cyan-50 seafoam:via-blue-50 seafoam:to-cyan-100 ocean:bg-linear-to-br ocean:from-zinc-950 ocean:via-cyan-950 ocean:to-zinc-950">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <PageHeader
          title="DailyWrite"
          description="Make goals and track your daily writing progress"
          dailyGoal={todayGoal}
          daysLeft={daysLeft}
          writtenToday={todayProgress}
          goalStartDate={currentGoal?.startDate}
          goalEndDate={currentGoal?.endDate}
        />

        {/* Weekly Calendar */}
        <div className="mb-8">
          <WeeklyCalendar
            dailyGoal={todayGoal}
            writingSessions={writingSessions}
          />
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <ProgressCard
            title="Today's Progress"
            current={todayProgress}
            goal={todayGoal}
            message={
              todayGoal - todayProgress > 0
                ? `${
                    todayGoal - todayProgress
                  } words remaining to reach your goal`
                : "Goal achieved! 🎉"
            }
          />
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard label="Current Streak" value={streak} subtitle="days" />
          <StatsCard
            label="Total Days Written"
            value={totalDaysWritten}
            subtitle="days"
          />
          <StatsCard
            label="Avg Words/Session"
            value={averageWordsPerDay}
            subtitle="words"
          />
          <StatsCard
            label="Total Words"
            value={totalWords}
            subtitle="all time"
          />
        </div>
      </div>
    </main>
  );
}
