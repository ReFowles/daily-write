import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import WritePageClient from "@/components/write/WritePageClient";

export default async function WritePage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/about");
  }

  return <WritePageClient />;
}
