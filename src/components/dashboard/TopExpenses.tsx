import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/dates";
import type { ExpenseWithCategory } from "@/lib/types";

interface TopExpensesProps {
  expenses: ExpenseWithCategory[];
  currencySymbol: string;
}

export function TopExpenses({ expenses, currencySymbol }: TopExpensesProps) {
  if (expenses.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Biggest expenses</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {expenses.map((expense, index) => (
          <div
            key={expense.id}
            className="flex items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs text-muted-foreground w-4 text-right flex-shrink-0">
                {index + 1}.
              </span>
              <div className="min-w-0">
                <p className="text-sm truncate">{expense.description}</p>
                <p className="text-xs text-muted-foreground">
                  {expense.category_name} &middot; {formatDate(expense.date)}
                </p>
              </div>
            </div>
            <span className="text-sm font-medium flex-shrink-0">
              {formatCurrency(expense.amount, currencySymbol)}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
