import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/currency";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";

interface MonthComparisonProps {
  currentTotal: number;
  averageTotal: number;
  monthCount: number;
  currencySymbol: string;
  isProrated: boolean;
  daysElapsed?: number;
  daysInMonth?: number;
  targetAmount?: number;
}

function pctChange(current: number, baseline: number): number {
  return baseline > 0 ? Math.round(((current - baseline) / baseline) * 100) : 0;
}

function pctColor(pct: number): string {
  if (pct <= 0) return "text-green-600";
  if (pct <= 10) return "text-yellow-500";
  return "text-red-500";
}

function PctBadge({ pct }: { pct: number }) {
  return (
    <span className={`inline-flex items-center gap-0.5 text-sm font-medium ${pctColor(pct)}`}>
      {pct > 0 ? (
        <TrendingUp className="h-3.5 w-3.5" />
      ) : pct < 0 ? (
        <TrendingDown className="h-3.5 w-3.5" />
      ) : (
        <Minus className="h-3.5 w-3.5" />
      )}
      {pct > 0 ? "+" : ""}{pct}%
    </span>
  );
}

export function MonthComparison({
  currentTotal,
  averageTotal,
  monthCount,
  currencySymbol,
  isProrated,
  daysElapsed,
  daysInMonth,
  targetAmount,
}: MonthComparisonProps) {
  if (monthCount === 0 && !targetAmount) return null;

  const hasTarget = targetAmount && targetAmount > 0;
  const prorateFactor =
    isProrated && daysElapsed && daysInMonth ? daysElapsed / daysInMonth : 1;

  const proratedAverage = averageTotal * prorateFactor;
  const proratedTarget = hasTarget ? targetAmount * prorateFactor : 0;

  const avgPct = pctChange(currentTotal, proratedAverage);
  const targetPct = hasTarget ? pctChange(currentTotal, proratedTarget) : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          {hasTarget ? "Compared to your target" : "Compared to your average"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Primary comparison: target if set, otherwise average */}
        {hasTarget ? (
          <div className="space-y-3">
            {/* Target row */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-sm text-muted-foreground">
                  {isProrated ? `Target through day ${daysElapsed}` : "Monthly target"}
                </p>
                <p className="text-lg font-semibold">
                  {formatCurrency(proratedTarget, currencySymbol)}
                </p>
              </div>
              <PctBadge pct={targetPct} />
            </div>
            {/* Average row (secondary) */}
            {monthCount > 0 && (
              <div className="flex items-center justify-between border-t pt-2">
                <div className="space-y-0.5">
                  <p className="text-sm text-muted-foreground">
                    {isProrated ? `Average through day ${daysElapsed}` : "Monthly average"}
                  </p>
                  <p className="text-base font-medium">
                    {formatCurrency(proratedAverage, currencySymbol)}
                  </p>
                </div>
                <PctBadge pct={avgPct} />
              </div>
            )}
          </div>
        ) : (
          /* Average only (no target set) */
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-sm text-muted-foreground">
                {isProrated ? `Average through day ${daysElapsed}` : "Monthly average"}
              </p>
              <p className="text-lg font-semibold">
                {formatCurrency(proratedAverage, currencySymbol)}
              </p>
            </div>
            <PctBadge pct={avgPct} />
          </div>
        )}

        {/* Footer */}
        <p className="text-xs text-muted-foreground">
          {isProrated
            ? `${monthCount > 0 ? `Based on ${monthCount} month${monthCount !== 1 ? "s" : ""} of data, prorated` : "Prorated"} to ${daysElapsed} of ${daysInMonth} days`
            : monthCount > 0
            ? `Based on ${monthCount} month${monthCount !== 1 ? "s" : ""} of data`
            : null}
        </p>
      </CardContent>
    </Card>
  );
}
