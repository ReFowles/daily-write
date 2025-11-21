import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { GoalsPageClient } from "@/components/GoalsPageClient";

export default async function GoalsPage() {
  const session = await auth();
  
  if (!session) {
    redirect("/about");
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GoalsPageClient />
    </Suspense>
  );
}
