import { LoginForm } from "@/components/auth/LoginForm";
import { getUsers } from "@/lib/dal/users";
import { ensureDbInitialized } from "@/lib/db/init";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

export default async function LoginPage() {
  ensureDbInitialized();
  const session = await getSession();
  if (session) redirect("/dashboard");

  const users = getUsers();
  const needsSetup = users.length === 0;

  if (needsSetup) redirect("/setup");

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Together</h1>
          <p className="text-muted-foreground">
            Welcome back! Who&apos;s logging in?
          </p>
        </div>
        <LoginForm users={users.map((u) => ({ id: u.id, display_name: u.display_name, has_pin: !!u.pin_hash }))} />
      </div>
    </div>
  );
}
