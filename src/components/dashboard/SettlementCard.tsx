import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";
import type { SplitMode } from "@/lib/types";

interface SettlementCardProps {
  amount: number;
  fromName: string;
  toName: string;
  currencySymbol: string;
  splitMode: SplitMode;
  incomeRatios: Record<string, number>;
  userMap: Record<string, string>;
}

export function SettlementCard({
  amount,
  fromName,
  toName,
  currencySymbol,
  splitMode,
  incomeRatios,
  userMap,
}: SettlementCardProps) {
  if (amount < 0.01) {
    return (
      <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
        <CardContent className="p-4 text-center">
          <p className="text-sm font-medium text-green-700 dark:text-green-300">
            All even! Nothing to settle this month.
          </p>
        </CardContent>
      </Card>
    );
  }

  const ratioText =
    splitMode === "equal"
      ? "50/50 split"
      : Object.entries(incomeRatios)
          .map(
            ([id, ratio]) =>
              `${userMap[id] || id}: ${Math.round(ratio * 100)}%`
          )
          .join(" / ");

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-center gap-3">
          <span className="font-medium">{fromName}</span>
          <div className="flex items-center gap-1 text-primary">
            <ArrowRight className="h-4 w-4" />
            <span className="text-lg font-bold">
              {formatCurrency(amount, currencySymbol)}
            </span>
            <ArrowRight className="h-4 w-4" />
          </div>
          <span className="font-medium">{toName}</span>
        </div>
        <p className="text-center text-xs text-muted-foreground">
          To even things up &middot; Based on {ratioText}
        </p>
      </CardContent>
    </Card>
  );
}
