import { getDb } from "@/lib/db";
import { ensureDbInitialized } from "@/lib/db/init";
import type {
  Expense,
  ExpenseWithCategory,
  CreateExpenseInput,
  UpdateExpenseInput,
} from "@/lib/types";

function db() {
  ensureDbInitialized();
  return getDb();
}

export function getExpenses(filters: {
  month?: string;
  categoryId?: number;
  paidBy?: string;
  source?: string;
  limit?: number;
  offset?: number;
}): ExpenseWithCategory[] {
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (filters.month) {
    conditions.push("substr(e.date, 1, 7) = ?");
    params.push(filters.month);
  }
  if (filters.categoryId) {
    conditions.push("e.category_id = ?");
    params.push(filters.categoryId);
  }
  if (filters.paidBy) {
    conditions.push("e.paid_by = ?");
    params.push(filters.paidBy);
  }
  if (filters.source) {
    conditions.push("e.source = ?");
    params.push(filters.source);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = filters.limit ? `LIMIT ${filters.limit}` : "";
  const offset = filters.offset ? `OFFSET ${filters.offset}` : "";

  return db()
    .prepare(
      `SELECT e.*, c.name as category_name, c.icon as category_icon, c.color as category_color
       FROM expenses e
       JOIN categories c ON e.category_id = c.id
       ${where}
       ORDER BY e.date DESC, e.created_at DESC
       ${limit} ${offset}`
    )
    .all(...params) as ExpenseWithCategory[];
}

export function getExpenseById(id: number): ExpenseWithCategory | undefined {
  return db()
    .prepare(
      `SELECT e.*, c.name as category_name, c.icon as category_icon, c.color as category_color
       FROM expenses e
       JOIN categories c ON e.category_id = c.id
       WHERE e.id = ?`
    )
    .get(id) as ExpenseWithCategory | undefined;
}

export function createExpense(data: CreateExpenseInput): Expense {
  const result = db()
    .prepare(
      `INSERT INTO expenses (date, description, category_id, amount, paid_by, notes, source, recurring_id, import_batch_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      data.date,
      data.description,
      data.category_id,
      data.amount,
      data.paid_by,
      data.notes || null,
      data.source || "manual",
      data.recurring_id || null,
      data.import_batch_id || null
    );

  return db()
    .prepare("SELECT * FROM expenses WHERE id = ?")
    .get(result.lastInsertRowid) as Expense;
}

export function updateExpense(id: number, data: UpdateExpenseInput): Expense {
  const fields: string[] = [];
  const params: (string | number | null)[] = [];

  if (data.date !== undefined) { fields.push("date = ?"); params.push(data.date); }
  if (data.description !== undefined) { fields.push("description = ?"); params.push(data.description); }
  if (data.category_id !== undefined) { fields.push("category_id = ?"); params.push(data.category_id); }
  if (data.amount !== undefined) { fields.push("amount = ?"); params.push(data.amount); }
  if (data.paid_by !== undefined) { fields.push("paid_by = ?"); params.push(data.paid_by); }
  if (data.notes !== undefined) { fields.push("notes = ?"); params.push(data.notes); }
  if (data.is_excluded !== undefined) { fields.push("is_excluded = ?"); params.push(data.is_excluded); }

  fields.push("updated_at = datetime('now')");

  db()
    .prepare(`UPDATE expenses SET ${fields.join(", ")} WHERE id = ?`)
    .run(...params, id);

  return db().prepare("SELECT * FROM expenses WHERE id = ?").get(id) as Expense;
}

export function deleteExpense(id: number): void {
  db().prepare("DELETE FROM expenses WHERE id = ?").run(id);
}

export function getExpensesByMonth(month: string): Expense[] {
  return db()
    .prepare(
      `SELECT * FROM expenses
       WHERE substr(date, 1, 7) = ? AND is_excluded = 0
       ORDER BY date DESC`
    )
    .all(month) as Expense[];
}

export function getRecentDescriptions(limit = 20): string[] {
  const rows = db()
    .prepare(
      `SELECT DISTINCT description FROM expenses
       WHERE source = 'manual'
       ORDER BY created_at DESC
       LIMIT ?`
    )
    .all(limit) as { description: string }[];
  return rows.map((r) => r.description);
}

export function getMonthlyTotals(month: string) {
  return db()
    .prepare(
      `SELECT
         paid_by,
         SUM(amount) as total,
         COUNT(*) as count
       FROM expenses
       WHERE substr(date, 1, 7) = ? AND is_excluded = 0
       GROUP BY paid_by`
    )
    .all(month) as { paid_by: string; total: number; count: number }[];
}

export function getTopExpenses(month: string, limit = 5): ExpenseWithCategory[] {
  return db()
    .prepare(
      `SELECT e.*, c.name as category_name, c.icon as category_icon, c.color as category_color
       FROM expenses e
       JOIN categories c ON e.category_id = c.id
       WHERE substr(e.date, 1, 7) = ? AND e.is_excluded = 0
       ORDER BY e.amount DESC
       LIMIT ?`
    )
    .all(month, limit) as ExpenseWithCategory[];
}

export function getMonthlyAverageExpenses(excludeMonth?: string): {
  average: number;
  monthCount: number;
} {
  // First try excluding the viewed month so it doesn't compare against itself
  if (excludeMonth) {
    const row = db()
      .prepare(
        `SELECT
           AVG(month_total) as average,
           COUNT(*) as month_count
         FROM (
           SELECT substr(date, 1, 7) as month, SUM(amount) as month_total
           FROM expenses
           WHERE is_excluded = 0
           GROUP BY substr(date, 1, 7)
         ) WHERE month != ?`
      )
      .get(excludeMonth) as { average: number | null; month_count: number };

    // If there are other months to compare against, use them
    if (row.month_count > 0) {
      return {
        average: row.average ? Math.round(row.average * 100) / 100 : 0,
        monthCount: row.month_count,
      };
    }
  }

  // Fallback: include all months (handles single-month data)
  const row = db()
    .prepare(
      `SELECT
         AVG(month_total) as average,
         COUNT(*) as month_count
       FROM (
         SELECT substr(date, 1, 7) as month, SUM(amount) as month_total
         FROM expenses
         WHERE is_excluded = 0
         GROUP BY substr(date, 1, 7)
       )`
    )
    .get() as { average: number | null; month_count: number };

  return {
    average: row.average ? Math.round(row.average * 100) / 100 : 0,
    monthCount: row.month_count || 0,
  };
}

export function getCategoryTotals(month: string) {
  return db()
    .prepare(
      `SELECT
         c.id, c.name, c.icon, c.color,
         SUM(e.amount) as total,
         COUNT(*) as count
       FROM expenses e
       JOIN categories c ON e.category_id = c.id
       WHERE substr(e.date, 1, 7) = ? AND e.is_excluded = 0
       GROUP BY c.id
       ORDER BY total DESC`
    )
    .all(month) as {
    id: number;
    name: string;
    icon: string;
    color: string;
    total: number;
    count: number;
  }[];
}
