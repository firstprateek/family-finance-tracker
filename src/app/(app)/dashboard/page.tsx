import { getSession } from "@/lib/auth/session";
import { getUsers } from "@/lib/dal/users";
import { getSetting } from "@/lib/dal/users";
import {
  getExpensesByMonth,
  getMonthlyTotals,
  getCategoryTotals,
  getTopExpenses,
  getMonthlyAverageExpenses,
} from "@/lib/dal/expenses";
import { computeSettlement } from "@/lib/services/settlement";
import {
  getCurrentMonth,
  formatMonth,
  getPreviousMonth,
  getNextMonth,
  isCurrentOrFutureMonth,
  isCurrentMonth,
  getDaysInMonth,
  getDaysElapsedInMonth,
} from "@/lib/utils/dates";
import { formatCurrency } from "@/lib/utils/currency";
import { MonthNavigator } from "@/components/dashboard/MonthNavigator";
import { SpendingByCategory } from "@/components/dashboard/SpendingByCategory";
import { UserContributions } from "@/components/dashboard/UserContributions";
import { MonthComparison } from "@/components/dashboard/MonthComparison";
import { TopExpenses } from "@/components/dashboard/TopExpenses";
import type { SplitMode } from "@/lib/types";

interface DashboardPageProps {
  searchParams: Promise<{ month?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const month = params.month || getCurrentMonth();
  const session = await getSession();
  const users = getUsers();
  const splitMode = (getSetting("split_mode") || "income_ratio") as SplitMode;
  const currencySymbol = getSetting("currency_symbol") || "$";

  const expenses = getExpensesByMonth(month);
  const monthlyTotals = getMonthlyTotals(month);
  const categoryTotals = getCategoryTotals(month);
  const settlement = computeSettlement(expenses, users, splitMode);
  const topExpenses = getTopExpenses(month, 5);
  const averageData = getMonthlyAverageExpenses(month);

  const totalExpenses = settlement.totalExpenses;

  // Determine if this is a completed month or current/future month
  const isCompletedMonth = !isCurrentOrFutureMonth(month);
  const isCurrentMo = isCurrentMonth(month);

  return (
    <div className="space-y-6">
      <MonthNavigator
        currentMonth={month}
        prevMonth={getPreviousMonth(month)}
        nextMonth={getNextMonth(month)}
        formattedMonth={formatMonth(month)}
      />

      {/* Total spending */}
      <div className="text-center space-y-1">
        <p className="text-sm text-muted-foreground">Together you spent</p>
        <p className="text-4xl font-bold tracking-tight">
          {formatCurrency(totalExpenses, currencySymbol)}
        </p>
        <p className="text-sm text-muted-foreground">
          {expenses.length} expense{expenses.length !== 1 ? "s" : ""} in{" "}
          {formatMonth(month)}
        </p>
      </div>

      {/* Who paid what — only for completed months */}
      {isCompletedMonth && users.length > 0 && (
        <UserContributions
          users={users}
          contributions={settlement.contributions}
          shares={settlement.shares}
          currencySymbol={currencySymbol}
        />
      )}

      {/* Spending by category */}
      {categoryTotals.length > 0 && (
        <SpendingByCategory
          categories={categoryTotals}
          total={totalExpenses}
          currencySymbol={currencySymbol}
        />
      )}

      {/* Month vs average comparison */}
      {averageData.monthCount > 0 && totalExpenses > 0 && (
        <MonthComparison
          currentTotal={totalExpenses}
          averageTotal={averageData.average}
          monthCount={averageData.monthCount}
          currencySymbol={currencySymbol}
          isProrated={isCurrentMo}
          daysElapsed={isCurrentMo ? getDaysElapsedInMonth(month) : undefined}
          daysInMonth={isCurrentMo ? getDaysInMonth(month) : undefined}
        />
      )}

      {/* Top 5 highest expenses */}
      {topExpenses.length > 0 && (
        <TopExpenses
          expenses={topExpenses}
          currencySymbol={currencySymbol}
        />
      )}

      {expenses.length === 0 && (
        <div className="py-12 text-center space-y-2">
          <p className="text-lg font-medium">No expenses yet</p>
          <p className="text-sm text-muted-foreground">
            Tap the + button to start tracking together
          </p>
        </div>
      )}
    </div>
  );
}
