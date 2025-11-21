import { signOut } from "@/lib/auth";
import { Button } from "./ui/Button";

export default function SignOutButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut();
      }}
    >
      <Button type="submit" variant="secondary">
        Sign out
      </Button>
    </form>
  );
}
