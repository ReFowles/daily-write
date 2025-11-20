import { Suspense } from "react";
import { GoalsPageClient } from "@/components/GoalsPageClient";

export default function GoalsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GoalsPageClient />
    </Suspense>
  );
}
