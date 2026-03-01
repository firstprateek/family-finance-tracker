import { notFound } from "next/navigation";
import { getImportBatchById } from "@/lib/dal/import-batches";
import { getExpenses } from "@/lib/dal/expenses";
import { getUsers } from "@/lib/dal/users";
import { getSetting } from "@/lib/dal/users";
import { ReconciliationView } from "@/components/import/ReconciliationView";
import { ensureDbInitialized } from "@/lib/db/init";

interface ReconciliationPageProps {
  params: Promise<{ batchId: string }>;
}

export default async function ReconciliationPage({
  params,
}: ReconciliationPageProps) {
  ensureDbInitialized();
  const { batchId } = await params;
  const batch = getImportBatchById(parseInt(batchId));
  if (!batch) notFound();

  const users = getUsers();
  const currencySymbol = getSetting("currency_symbol") || "$";
  const userMap = Object.fromEntries(users.map((u) => [u.id, u.display_name]));

  // Get all expenses from this batch
  const csvExpenses = getExpenses({}).filter(
    (e) => e.import_batch_id === batch.id
  );

  // Get matched manual expenses
  const matchedManualIds = csvExpenses
    .filter((e) => e.matched_with_id)
    .map((e) => e.matched_with_id!);

  const allExpenses = getExpenses({});
  const matchedManualExpenses = allExpenses.filter((e) =>
    matchedManualIds.includes(e.id)
  );

  // Categorize
  const autoMatched = csvExpenses.filter(
    (e) => e.match_status === "matched" || e.match_status === "confirmed"
  );
  const unmatched = csvExpenses.filter(
    (e) => e.match_status === "unmatched" && !e.matched_with_id
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Review Import</h1>
        <p className="text-sm text-muted-foreground">
          {batch.card_label || batch.filename} &middot; {batch.row_count} transactions
        </p>
      </div>

      <ReconciliationView
        batch={batch}
        csvExpenses={csvExpenses}
        matchedManualExpenses={matchedManualExpenses}
        autoMatchedCount={autoMatched.length}
        unmatchedCount={unmatched.length}
        userMap={userMap}
        currencySymbol={currencySymbol}
      />
    </div>
  );
}
