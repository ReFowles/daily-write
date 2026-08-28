import { auth } from "@/lib/auth";
import SignInButton from "@/components/SignInButton";
import { AboutPageClient } from "./AboutPageClient";

export default async function AboutPage() {
  const session = await auth();
  return (
    <AboutPageClient
      isSignedIn={!!session?.user?.email}
      signInSlot={<SignInButton />}
    />
  );
}
