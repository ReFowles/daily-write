import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DashboardClient } from "@/components/DashboardClient";
import { getAllGoals, getAllWritingSessions, getWritingStats } from "@/lib/data-store";

export default async function Dashboard() {
  const session = await auth();
  
  if (!session?.user?.email) {
    redirect("/about");
  }

  const userId = session.user.email;

  // Fetch data on the server
  const [goals, writingSessions, stats] = await Promise.all([
    getAllGoals(userId),
    getAllWritingSessions(userId),
    getWritingStats(userId),
  ]);

  // Serialize data to plain objects for Client Component
  const serializedGoals = JSON.parse(JSON.stringify(goals));
  const serializedWritingSessions = JSON.parse(JSON.stringify(writingSessions));

  return (
    <DashboardClient
      goals={serializedGoals}
      writingSessions={serializedWritingSessions}
      stats={stats}
    />
  );
}
