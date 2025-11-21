import { signIn } from "@/lib/auth";
import { Button } from "./ui/Button";

export default function SignInButton() {
  return (
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
  );
}
