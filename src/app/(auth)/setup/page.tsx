import { SetupForm } from "@/components/auth/SetupForm";
import { getUsers } from "@/lib/dal/users";
import { ensureDbInitialized } from "@/lib/db/init";
import { redirect } from "next/navigation";

export default async function SetupPage() {
  ensureDbInitialized();
  const users = getUsers();
  if (users.length > 0) redirect("/login");

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Welcome!</h1>
          <p className="text-muted-foreground">
            Set up your household to start tracking finances together.
          </p>
        </div>
        <SetupForm />
      </div>
    </div>
  );
}
