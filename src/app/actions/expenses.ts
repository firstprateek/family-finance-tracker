"use server";

import { revalidatePath } from "next/cache";
import { ensureDbInitialized } from "@/lib/db/init";
import {
  createExpense,
  updateExpense,
  deleteExpense,
} from "@/lib/dal/expenses";
import { getSession } from "@/lib/auth/session";
import type { CreateExpenseInput, UpdateExpenseInput } from "@/lib/types";

export async function createExpenseAction(
  data: CreateExpenseInput
): Promise<{ success: boolean; error?: string }> {
  ensureDbInitialized();
  const session = await getSession();
  if (!session) return { success: false, error: "Not authenticated" };

  if (!data.date || !data.description || !data.category_id || !data.amount || !data.paid_by) {
    return { success: false, error: "All fields are required" };
  }

  if (data.amount <= 0) {
    return { success: false, error: "Amount must be positive" };
  }

  createExpense(data);
  revalidatePath("/dashboard");
  revalidatePath("/expenses");
  return { success: true };
}

export async function updateExpenseAction(
  id: number,
  data: UpdateExpenseInput
): Promise<{ success: boolean; error?: string }> {
  ensureDbInitialized();
  const session = await getSession();
  if (!session) return { success: false, error: "Not authenticated" };

  updateExpense(id, data);
  revalidatePath("/dashboard");
  revalidatePath("/expenses");
  return { success: true };
}

export async function deleteExpenseAction(
  id: number
): Promise<{ success: boolean; error?: string }> {
  ensureDbInitialized();
  const session = await getSession();
  if (!session) return { success: false, error: "Not authenticated" };

  deleteExpense(id);
  revalidatePath("/dashboard");
  revalidatePath("/expenses");
  return { success: true };
}
