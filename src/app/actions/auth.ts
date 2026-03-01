"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { createSession } from "@/lib/auth/session";
import { getUserById, createUser } from "@/lib/dal/users";
import { getUsers } from "@/lib/dal/users";
import { ensureDbInitialized } from "@/lib/db/init";

export async function loginAction(
  userId: string,
  pin: string
): Promise<{ error: string } | never> {
  ensureDbInitialized();
  const user = getUserById(userId);
  if (!user) {
    return { error: "User not found" };
  }

  if (user.pin_hash) {
    const valid = await bcrypt.compare(pin, user.pin_hash);
    if (!valid) {
      return { error: "Incorrect PIN" };
    }
  }

  await createSession(userId);
  redirect("/dashboard");
}

export async function setupAction(
  formData: FormData
): Promise<{ error: string } | never> {
  ensureDbInitialized();

  const existingUsers = getUsers();
  if (existingUsers.length > 0) {
    return { error: "Household already set up" };
  }

  const name1 = (formData.get("name1") as string)?.trim();
  const name2 = (formData.get("name2") as string)?.trim();
  const income1 = parseFloat(formData.get("income1") as string) || 0;
  const income2 = parseFloat(formData.get("income2") as string) || 0;
  const pin1 = (formData.get("pin1") as string)?.trim();
  const pin2 = (formData.get("pin2") as string)?.trim();

  if (!name1 || !name2) {
    return { error: "Both names are required" };
  }

  const id1 = name1.toLowerCase().replace(/[^a-z0-9]/g, "");
  const id2 = name2.toLowerCase().replace(/[^a-z0-9]/g, "");

  if (id1 === id2) {
    return { error: "Names must be different" };
  }

  const pin1Hash = pin1 && pin1.length >= 4 ? await bcrypt.hash(pin1, 10) : null;
  const pin2Hash = pin2 && pin2.length >= 4 ? await bcrypt.hash(pin2, 10) : null;

  createUser({ id: id1, display_name: name1, income: income1, pin_hash: pin1Hash ?? undefined });
  createUser({ id: id2, display_name: name2, income: income2, pin_hash: pin2Hash ?? undefined });

  await createSession(id1);
  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  const { destroySession } = await import("@/lib/auth/session");
  await destroySession();
  redirect("/login");
}
