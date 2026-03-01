"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, ArrowLeft } from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/dates";
import { confirmMatchAction, rejectMatchAction, finalizeBatchAction } from "@/app/actions/import";
import { toast } from "sonner";
import type { CsvImportBatch, ExpenseWithCategory } from "@/lib/types";

interface ReconciliationViewProps {
  batch: CsvImportBatch;
  csvExpenses: ExpenseWithCategory[];
  matchedManualExpenses: ExpenseWithCategory[];
  autoMatchedCount: number;
  unmatchedCount: number;
  userMap: Record<string, string>;
  currencySymbol: string;
}

export function ReconciliationView({
  batch,
  csvExpenses,
  matchedManualExpenses,
  autoMatchedCount,
  unmatchedCount,
  userMap,
  currencySymbol,
}: ReconciliationViewProps) {
  const router = useRouter();
  const manualMap = new Map(matchedManualExpenses.map((e) => [e.id, e]));

  const matched = csvExpenses.filter(
    (e) => e.match_status === "matched" || e.match_status === "confirmed"
  );
  const unmatched = csvExpenses.filter((e) => e.match_status === "unmatched");

  async function handleConfirm(csvId: number, manualId: number) {
    await confirmMatchAction(csvId, manualId);
    toast.success("Match confirmed");
    router.refresh();
  }

  async function handleReject(csvId: number, manualId: number) {
    await rejectMatchAction(csvId, manualId);
    toast.success("Match removed");
    router.refresh();
  }

  async function handleFinalize() {
    await finalizeBatchAction(batch.id);
    toast.success("Import finalized");
    router.push("/import");
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg bg-green-50 dark:bg-green-950 p-3">
          <p className="text-xl font-bold text-green-600">{matched.length}</p>
          <p className="text-xs text-muted-foreground">Matched</p>
        </div>
        <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-3">
          <p className="text-xl font-bold text-blue-600">{unmatched.length}</p>
          <p className="text-xs text-muted-foreground">New</p>
        </div>
        <div className="rounded-lg bg-muted p-3">
          <p className="text-xl font-bold">{batch.row_count}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </div>
      </div>

      {/* Matched expenses */}
      {matched.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Matched Expenses ({matched.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {matched.map((csvExp) => {
              const manualExp = csvExp.matched_with_id
                ? manualMap.get(csvExp.matched_with_id)
                : null;

              return (
                <div
                  key={csvExp.id}
                  className="rounded-lg border p-3 space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px]">
                          CSV
                        </Badge>
                        <span className="text-sm">{csvExp.description}</span>
                      </div>
                      {manualExp && (
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">
                            Manual
                          </Badge>
                          <span className="text-sm">
                            {manualExp.description}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-semibold text-sm">
                        {formatCurrency(csvExp.amount, currencySymbol)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(csvExp.date)}
                      </p>
                    </div>
                  </div>

                  {csvExp.match_status === "matched" && manualExp && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-8 text-xs"
                        onClick={() => handleConfirm(csvExp.id, manualExp.id)}
                      >
                        <Check className="h-3 w-3 mr-1" /> Confirm
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-8 text-xs"
                        onClick={() => handleReject(csvExp.id, manualExp.id)}
                      >
                        <X className="h-3 w-3 mr-1" /> Not a match
                      </Button>
                    </div>
                  )}
                  {csvExp.match_status === "confirmed" && (
                    <p className="text-xs text-green-600 font-medium">
                      Confirmed
                    </p>
                  )}

                  {csvExp.match_confidence && (
                    <p className="text-[10px] text-muted-foreground">
                      Confidence: {Math.round(csvExp.match_confidence * 100)}%
                    </p>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Unmatched CSV expenses (new) */}
      {unmatched.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              New from Statement ({unmatched.length})
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              These weren&apos;t matched to any manually entered expenses
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            {unmatched.map((exp) => (
              <div
                key={exp.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <p className="text-sm font-medium">{exp.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(exp.date)} &middot;{" "}
                    {userMap[exp.paid_by] || exp.paid_by}
                  </p>
                </div>
                <p className="font-semibold text-sm">
                  {formatCurrency(exp.amount, currencySymbol)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={() => router.push("/import")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        {batch.status !== "completed" && (
          <Button className="flex-1" onClick={handleFinalize}>
            Finalize Import
          </Button>
        )}
      </div>
    </div>
  );
}
