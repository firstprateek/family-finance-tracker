import { getDb } from "@/lib/db";
import { ensureDbInitialized } from "@/lib/db/init";
import { getActiveRecurringExpenses } from "@/lib/dal/recurring";
import { createExpense } from "@/lib/dal/expenses";

export function generateRecurringExpenses(month: string): number {
  ensureDbInitialized();
  const db = getDb();
  const templates = getActiveRecurringExpenses();
  const [year, m] = month.split("-").map(Number);
  let generated = 0;

  for (const template of templates) {
    // Check if already generated for this month
    const existing = db
      .prepare(
        `SELECT COUNT(*) as count FROM expenses
         WHERE recurring_id = ? AND substr(date, 1, 7) = ?`
      )
      .get(template.id, month) as { count: number };

    if (existing.count > 0) continue;

    // Check if template is active for this month
    const startDate = new Date(template.start_date);
    const targetDate = new Date(year, m - 1);
    if (targetDate < new Date(startDate.getFullYear(), startDate.getMonth())) continue;

    if (template.end_date) {
      const endDate = new Date(template.end_date);
      if (targetDate > new Date(endDate.getFullYear(), endDate.getMonth())) continue;
    }

    // For monthly frequency, generate one expense
    if (template.frequency === "monthly") {
      const day = template.day_of_month
        ? Math.min(template.day_of_month, new Date(year, m, 0).getDate())
        : 1;
      const expenseDate = `${month}-${String(day).padStart(2, "0")}`;

      createExpense({
        date: expenseDate,
        description: template.description,
        category_id: template.category_id,
        amount: template.amount,
        paid_by: template.paid_by,
        notes: template.notes || undefined,
        source: "recurring",
        recurring_id: template.id,
      });
      generated++;
    }

    // For yearly frequency, only generate in the start month
    if (template.frequency === "yearly") {
      const startMonth = startDate.getMonth() + 1;
      if (m === startMonth) {
        const day = template.day_of_month
          ? Math.min(template.day_of_month, new Date(year, m, 0).getDate())
          : 1;
        const expenseDate = `${month}-${String(day).padStart(2, "0")}`;

        createExpense({
          date: expenseDate,
          description: template.description,
          category_id: template.category_id,
          amount: template.amount,
          paid_by: template.paid_by,
          notes: template.notes || undefined,
          source: "recurring",
          recurring_id: template.id,
        });
        generated++;
      }
    }
  }

  return generated;
}
