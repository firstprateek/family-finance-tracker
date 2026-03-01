"use server";

import { revalidatePath } from "next/cache";
import { ensureDbInitialized } from "@/lib/db/init";
import { getSession } from "@/lib/auth/session";
import { updateUser, setSetting } from "@/lib/dal/users";

export async function updateSettingsAction(data: {
  users: { id: string; display_name: string; income: number }[];
  splitMode?: string;
}): Promise<{ success: boolean; error?: string }> {
  ensureDbInitialized();
  const session = await getSession();
  if (!session) return { success: false, error: "Not authenticated" };

  for (const user of data.users) {
    updateUser(user.id, {
      display_name: user.display_name,
      income: user.income,
    });
  }

  if (data.splitMode) {
    setSetting("split_mode", data.splitMode);
  }

  revalidatePath("/dashboard");
  revalidatePath("/settings");
  return { success: true };
}
