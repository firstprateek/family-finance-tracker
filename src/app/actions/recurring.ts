"use server";

import { revalidatePath } from "next/cache";
import { ensureDbInitialized } from "@/lib/db/init";
import { getSession } from "@/lib/auth/session";
import {
  createRecurringExpense,
  updateRecurringExpense,
  deleteRecurringExpense,
} from "@/lib/dal/recurring";
import { generateRecurringExpenses } from "@/lib/services/recurring-generator";

export async function createRecurringAction(data: {
  description: string;
  category_id: number;
  amount: number;
  paid_by: string;
  frequency?: string;
  day_of_month?: number;
  start_date: string;
  notes?: string;
}): Promise<{ success: boolean; error?: string }> {
  ensureDbInitialized();
  const session = await getSession();
  if (!session) return { success: false, error: "Not authenticated" };

  createRecurringExpense(data);
  revalidatePath("/recurring");
  return { success: true };
}

export async function updateRecurringAction(
  id: number,
  data: Partial<{
    description: string;
    category_id: number;
    amount: number;
    paid_by: string;
    frequency: string;
    day_of_month: number;
    is_active: number;
    notes: string;
  }>
): Promise<{ success: boolean; error?: string }> {
  ensureDbInitialized();
  const session = await getSession();
  if (!session) return { success: false, error: "Not authenticated" };

  updateRecurringExpense(id, data);
  revalidatePath("/recurring");
  return { success: true };
}

export async function deleteRecurringAction(
  id: number
): Promise<{ success: boolean; error?: string }> {
  ensureDbInitialized();
  const session = await getSession();
  if (!session) return { success: false, error: "Not authenticated" };

  deleteRecurringExpense(id);
  revalidatePath("/recurring");
  return { success: true };
}

export async function generateRecurringAction(
  month: string
): Promise<{ success: boolean; generated: number; error?: string }> {
  ensureDbInitialized();
  const session = await getSession();
  if (!session) return { success: false, generated: 0, error: "Not authenticated" };

  const generated = generateRecurringExpenses(month);
  revalidatePath("/dashboard");
  revalidatePath("/expenses");
  revalidatePath("/recurring");
  return { success: true, generated };
}
