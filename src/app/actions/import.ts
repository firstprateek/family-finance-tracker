"use server";

import { revalidatePath } from "next/cache";
import { ensureDbInitialized } from "@/lib/db/init";
import { getSession } from "@/lib/auth/session";
import { createImportBatch, updateImportBatch } from "@/lib/dal/import-batches";
import { createCsvProfile } from "@/lib/dal/csv-profiles";
import { createExpense } from "@/lib/dal/expenses";
import { parseCsvWithProfile, detectCsvColumns } from "@/lib/services/csv-parser";
import { runReconciliation, confirmMatch, rejectMatch } from "@/lib/services/reconciliation";
import type { CsvProfile } from "@/lib/types";

export async function detectColumnsAction(csvContent: string) {
  return detectCsvColumns(csvContent);
}

export async function importCsvAction(data: {
  csvContent: string;
  profileId?: number;
  profileData?: {
    name: string;
    date_column: string;
    description_column: string;
    amount_column: string;
    date_format: string;
    amount_sign: "positive" | "negative";
  };
  paidBy: string;
  month?: string;
}): Promise<{
  success: boolean;
  batchId?: number;
  rowCount?: number;
  error?: string;
}> {
  ensureDbInitialized();
  const session = await getSession();
  if (!session) return { success: false, error: "Not authenticated" };

  let profile: CsvProfile;

  if (data.profileData) {
    // Create new profile
    profile = createCsvProfile(data.profileData);
  } else if (data.profileId) {
    const { getCsvProfileById } = await import("@/lib/dal/csv-profiles");
    const existing = getCsvProfileById(data.profileId);
    if (!existing) return { success: false, error: "Profile not found" };
    profile = existing;
  } else {
    return { success: false, error: "No CSV profile specified" };
  }

  // Parse CSV
  const parseResult = parseCsvWithProfile(data.csvContent, profile);

  if (parseResult.errors.length > 0) {
    return { success: false, error: parseResult.errors.join("; ") };
  }

  if (parseResult.rows.length === 0) {
    return { success: false, error: "No valid expense rows found in CSV" };
  }

  // Determine month from first row if not specified
  const month = data.month || parseResult.rows[0].date.slice(0, 7);

  // Create import batch
  const batch = createImportBatch({
    filename: data.profileData?.name || "import.csv",
    card_label: profile.name,
    imported_by: session.id,
    row_count: parseResult.rows.length,
    month,
  });

  // Insert CSV rows as expenses
  for (const row of parseResult.rows) {
    createExpense({
      date: row.date,
      description: row.description,
      category_id: 15, // "Other" category — will be categorized later
      amount: row.amount,
      paid_by: data.paidBy,
      source: "csv_import",
      import_batch_id: batch.id,
    });
  }

  revalidatePath("/import");
  revalidatePath("/expenses");
  revalidatePath("/dashboard");

  return { success: true, batchId: batch.id, rowCount: parseResult.rows.length };
}

export async function reconcileBatchAction(
  batchId: number
): Promise<{
  success: boolean;
  autoMatched?: number;
  suggested?: number;
  unmatchedCsv?: number;
  error?: string;
}> {
  ensureDbInitialized();
  const session = await getSession();
  if (!session) return { success: false, error: "Not authenticated" };

  const result = runReconciliation(batchId);

  revalidatePath(`/import/${batchId}`);
  revalidatePath("/expenses");

  return {
    success: true,
    autoMatched: result.autoMatched.length,
    suggested: result.suggested.length,
    unmatchedCsv: result.unmatchedCsv.length,
  };
}

export async function confirmMatchAction(
  csvId: number,
  manualId: number
): Promise<{ success: boolean }> {
  ensureDbInitialized();
  confirmMatch(csvId, manualId);
  revalidatePath("/import");
  revalidatePath("/expenses");
  return { success: true };
}

export async function rejectMatchAction(
  csvId: number,
  manualId: number
): Promise<{ success: boolean }> {
  ensureDbInitialized();
  rejectMatch(csvId, manualId);
  revalidatePath("/import");
  revalidatePath("/expenses");
  return { success: true };
}

export async function finalizeBatchAction(
  batchId: number
): Promise<{ success: boolean }> {
  ensureDbInitialized();
  updateImportBatch(batchId, { status: "completed" });
  revalidatePath("/import");
  revalidatePath("/dashboard");
  return { success: true };
}
