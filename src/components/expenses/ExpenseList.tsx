"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/dates";
import { deleteExpenseAction } from "@/app/actions/expenses";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { ExpenseWithCategory } from "@/lib/types";

interface ExpenseListProps {
  expenses: ExpenseWithCategory[];
  userMap: Record<string, string>;
  currencySymbol: string;
}

export function ExpenseList({
  expenses,
  userMap,
  currencySymbol,
}: ExpenseListProps) {
  const router = useRouter();

  // Group expenses by date
  const grouped = expenses.reduce<Record<string, ExpenseWithCategory[]>>(
    (acc, expense) => {
      const date = expense.date;
      if (!acc[date]) acc[date] = [];
      acc[date].push(expense);
      return acc;
    },
    {}
  );

  async function handleDelete(id: number) {
    const result = await deleteExpenseAction(id);
    if (result.success) {
      toast.success("Removed");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to delete");
    }
  }

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([date, items]) => (
        <div key={date} className="space-y-2">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {formatDate(date)}
          </h3>
          {items.map((expense) => (
            <Card key={expense.id} className="group">
              <CardContent className="flex items-center gap-3 p-3">
                <div
                  className="h-10 w-10 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{
                    backgroundColor: expense.category_color || "#6366f1",
                  }}
                >
                  {expense.category_name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {expense.description}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">
                      {userMap[expense.paid_by] || expense.paid_by}
                    </span>
                    {expense.source !== "manual" && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {expense.source === "recurring" ? "Recurring" : "CSV"}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-semibold">
                    {formatCurrency(expense.amount, currencySymbol)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 flex-shrink-0"
                  onClick={() => handleDelete(expense.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ))}
    </div>
  );
}
