"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CsvImportBatch } from "@/lib/types";

interface ImportHistoryProps {
  batches: CsvImportBatch[];
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  review: "bg-orange-100 text-orange-800",
  completed: "bg-green-100 text-green-800",
};

export function ImportHistory({ batches }: ImportHistoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Import History</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {batches.map((batch) => (
          <Link
            key={batch.id}
            href={`/import/${batch.id}`}
            className="block rounded-lg border p-3 hover:bg-accent transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">
                  {batch.card_label || batch.filename}
                </p>
                <p className="text-xs text-muted-foreground">
                  {batch.row_count} rows &middot; {batch.month || "Unknown month"} &middot;{" "}
                  {new Date(batch.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className={statusColors[batch.status] || ""}
                >
                  {batch.status}
                </Badge>
              </div>
            </div>
            {batch.status === "review" && (
              <p className="text-xs text-muted-foreground mt-1">
                {batch.matched_count} matched, {batch.unmatched_count} unmatched
              </p>
            )}
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
