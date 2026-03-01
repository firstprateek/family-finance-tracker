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
}

export function MonthComparison({
  currentTotal,
  averageTotal,
  monthCount,
  currencySymbol,
  isProrated,
  daysElapsed,
  daysInMonth,
}: MonthComparisonProps) {
  if (monthCount === 0) return null;

  const compareValue = isProrated && daysElapsed && daysInMonth
    ? (averageTotal * daysElapsed) / daysInMonth
    : averageTotal;

  const diff = currentTotal - compareValue;
  const pctChange =
    compareValue > 0 ? Math.round((diff / compareValue) * 100) : 0;
  const isOver = diff > 1;
  const isUnder = diff < -1;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Compared to your average</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-sm text-muted-foreground">
              {isProrated
                ? `Average through day ${daysElapsed}`
                : `Monthly average`}
            </p>
            <p className="text-lg font-semibold">
              {formatCurrency(compareValue, currencySymbol)}
            </p>
          </div>
          <div
            className={`flex items-center gap-1 text-sm font-medium ${
              isOver
                ? "text-red-500"
                : isUnder
                ? "text-green-600"
                : "text-muted-foreground"
            }`}
          >
            {isOver ? (
              <TrendingUp className="h-4 w-4" />
            ) : isUnder ? (
              <TrendingDown className="h-4 w-4" />
            ) : (
              <Minus className="h-4 w-4" />
            )}
            <span>
              {isOver ? "+" : ""}
              {pctChange}%
            </span>
          </div>
        </div>
        {isProrated && (
          <p className="text-xs text-muted-foreground">
            Based on {monthCount} month{monthCount !== 1 ? "s" : ""} of data,
            prorated to {daysElapsed} of {daysInMonth} days
          </p>
        )}
        {!isProrated && (
          <p className="text-xs text-muted-foreground">
            Based on {monthCount} month{monthCount !== 1 ? "s" : ""} of data
          </p>
        )}
      </CardContent>
    </Card>
  );
}
