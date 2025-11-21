import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DashboardClient } from "@/components/DashboardClient";
import { getAllGoals, getAllWritingSessions, getWritingStats } from "@/lib/data-store";

export default async function Dashboard() {
  const session = await auth();
  
  if (!session) {
    redirect("/about");
  }

  // Fetch data on the server
  const [goals, writingSessions, stats] = await Promise.all([
    getAllGoals(),
    getAllWritingSessions(),
    getWritingStats(),
  ]);

  return (
    <DashboardClient
      goals={goals}
      writingSessions={writingSessions}
      stats={stats}
    />
  );
}
