import { signIn } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { UnverifiedAppNotice } from "./UnverifiedAppNotice";

export default function SignInButton() {
  return (
    <div className="inline-flex items-center gap-1">
      <form
        action={async () => {
          "use server";
          await signIn("google");
        }}
      >
        <Button type="submit" variant="primary">
          Sign in with Google
        </Button>
      </form>
      <UnverifiedAppNotice />
    </div>
  );
}
