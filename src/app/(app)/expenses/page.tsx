import { getExpenses } from "@/lib/dal/expenses";
import { getUsers } from "@/lib/dal/users";
import { getCategories } from "@/lib/dal/categories";
import { getSetting } from "@/lib/dal/users";
import { getCurrentMonth, formatMonth, getPreviousMonth, getNextMonth } from "@/lib/utils/dates";
import { MonthNavigator } from "@/components/dashboard/MonthNavigator";
import { ExpenseList } from "@/components/expenses/ExpenseList";
import { ExpenseFilters } from "@/components/expenses/ExpenseFilters";

interface ExpensesPageProps {
  searchParams: Promise<{
    month?: string;
    category?: string;
    paidBy?: string;
    source?: string;
  }>;
}

export default async function ExpensesPage({ searchParams }: ExpensesPageProps) {
  const params = await searchParams;
  const month = params.month || getCurrentMonth();
  const currencySymbol = getSetting("currency_symbol") || "$";
  const users = getUsers();
  const categories = getCategories();

  const expenses = getExpenses({
    month,
    categoryId: params.category ? parseInt(params.category) : undefined,
    paidBy: params.paidBy || undefined,
    source: params.source || undefined,
  });

  const userMap = Object.fromEntries(users.map((u) => [u.id, u.display_name]));

  return (
    <div className="space-y-4">
      <MonthNavigator
        currentMonth={month}
        prevMonth={getPreviousMonth(month)}
        nextMonth={getNextMonth(month)}
        formattedMonth={formatMonth(month)}
      />

      <ExpenseFilters
        users={users.map((u) => ({ id: u.id, display_name: u.display_name }))}
        categories={categories}
        currentFilters={params}
        month={month}
      />

      <ExpenseList
        expenses={expenses}
        userMap={userMap}
        currencySymbol={currencySymbol}
      />

      {expenses.length === 0 && (
        <div className="py-12 text-center space-y-2">
          <p className="text-lg font-medium">No expenses found</p>
          <p className="text-sm text-muted-foreground">
            {params.category || params.paidBy || params.source
              ? "Try adjusting your filters"
              : "Start adding expenses to see them here"}
          </p>
        </div>
      )}
    </div>
  );
}
