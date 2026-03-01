import type { Expense, SettlementResult, User } from "@/lib/types";

export function computeSettlement(
  expenses: Expense[],
  users: User[],
  splitMode: "income_ratio" | "equal" = "income_ratio"
): SettlementResult {
  const activeExpenses = expenses.filter((e) => !e.is_excluded);
  const totalExpenses = activeExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Calculate how much each person paid
  const contributions: Record<string, number> = {};
  for (const user of users) {
    contributions[user.id] = activeExpenses
      .filter((e) => e.paid_by === user.id)
      .reduce((sum, e) => sum + e.amount, 0);
  }

  // Calculate income info
  const incomes: Record<string, number> = {};
  const incomeRatios: Record<string, number> = {};
  const totalIncome = users.reduce((sum, u) => sum + u.income, 0);

  for (const user of users) {
    incomes[user.id] = user.income;
    incomeRatios[user.id] =
      splitMode === "equal"
        ? 1 / users.length
        : totalIncome > 0
          ? user.income / totalIncome
          : 1 / users.length;
  }

  // Calculate each person's fair share
  const shares: Record<string, number> = {};
  for (const user of users) {
    shares[user.id] = totalExpenses * incomeRatios[user.id];
  }

  // Find who overpaid the most (they are owed money)
  // For two people this simplifies to a single settlement
  let maxOverpayment = 0;
  let settlementFrom: string | null = null;
  let settlementTo: string | null = null;

  if (users.length === 2) {
    const [u1, u2] = users;
    const u1Overpayment = contributions[u1.id] - shares[u1.id];
    if (Math.abs(u1Overpayment) < 0.01) {
      // Settled
    } else if (u1Overpayment > 0) {
      settlementFrom = u2.id;
      settlementTo = u1.id;
      maxOverpayment = u1Overpayment;
    } else {
      settlementFrom = u1.id;
      settlementTo = u2.id;
      maxOverpayment = Math.abs(u1Overpayment);
    }
  }

  return {
    totalExpenses,
    contributions,
    shares,
    incomes,
    incomeRatios,
    settlementAmount: Math.round(maxOverpayment * 100) / 100,
    settlementFrom,
    settlementTo,
  };
}
