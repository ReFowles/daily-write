import { auth } from "@/lib/auth";
import SignInButton from "@/components/navigation/SignInButton";
import { AboutPageClient } from "@/components/about/AboutPageClient";

export default async function AboutPage() {
  const session = await auth();
  return (
    <AboutPageClient
      isSignedIn={!!session?.user?.email}
      signInSlot={<SignInButton />}
    />
  );
}
