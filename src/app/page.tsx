import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { ensureDbInitialized } from "@/lib/db/init";

export default async function Home() {
  ensureDbInitialized();
  const session = await getSession();
  if (session) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}
