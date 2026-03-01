import { cookies } from "next/headers";
import { getUserById } from "@/lib/dal/users";
import type { User } from "@/lib/types";

const SESSION_COOKIE = "finance_session";
const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

export async function createSession(userId: string): Promise<void> {
  const cookieStore = await cookies();
  // Simple session: store user ID directly (sufficient for local-only app)
  const token = Buffer.from(
    JSON.stringify({ userId, createdAt: Date.now() })
  ).toString("base64");

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

export async function getSession(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { userId } = JSON.parse(Buffer.from(token, "base64").toString());
    const user = getUserById(userId);
    return user || null;
  } catch {
    return null;
  }
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
