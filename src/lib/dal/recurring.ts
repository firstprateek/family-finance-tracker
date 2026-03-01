import { getDb } from "@/lib/db";
import { ensureDbInitialized } from "@/lib/db/init";
import type { RecurringExpense } from "@/lib/types";

function db() {
  ensureDbInitialized();
  return getDb();
}

export function getRecurringExpenses(): RecurringExpense[] {
  return db()
    .prepare("SELECT * FROM recurring_expenses ORDER BY is_active DESC, description ASC")
    .all() as RecurringExpense[];
}

export function getActiveRecurringExpenses(): RecurringExpense[] {
  return db()
    .prepare("SELECT * FROM recurring_expenses WHERE is_active = 1 ORDER BY description ASC")
    .all() as RecurringExpense[];
}

export function createRecurringExpense(data: {
  description: string;
  category_id: number;
  amount: number;
  paid_by: string;
  frequency?: string;
  day_of_month?: number;
  start_date: string;
  end_date?: string;
  notes?: string;
}): RecurringExpense {
  const result = db()
    .prepare(
      `INSERT INTO recurring_expenses (description, category_id, amount, paid_by, frequency, day_of_month, start_date, end_date, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      data.description,
      data.category_id,
      data.amount,
      data.paid_by,
      data.frequency || "monthly",
      data.day_of_month || null,
      data.start_date,
      data.end_date || null,
      data.notes || null
    );

  return db()
    .prepare("SELECT * FROM recurring_expenses WHERE id = ?")
    .get(result.lastInsertRowid) as RecurringExpense;
}

export function updateRecurringExpense(
  id: number,
  data: Partial<{
    description: string;
    category_id: number;
    amount: number;
    paid_by: string;
    frequency: string;
    day_of_month: number;
    is_active: number;
    notes: string;
  }>
): RecurringExpense {
  const fields: string[] = [];
  const params: (string | number | null)[] = [];

  if (data.description !== undefined) { fields.push("description = ?"); params.push(data.description); }
  if (data.category_id !== undefined) { fields.push("category_id = ?"); params.push(data.category_id); }
  if (data.amount !== undefined) { fields.push("amount = ?"); params.push(data.amount); }
  if (data.paid_by !== undefined) { fields.push("paid_by = ?"); params.push(data.paid_by); }
  if (data.frequency !== undefined) { fields.push("frequency = ?"); params.push(data.frequency); }
  if (data.day_of_month !== undefined) { fields.push("day_of_month = ?"); params.push(data.day_of_month); }
  if (data.is_active !== undefined) { fields.push("is_active = ?"); params.push(data.is_active); }
  if (data.notes !== undefined) { fields.push("notes = ?"); params.push(data.notes); }

  fields.push("updated_at = datetime('now')");

  db()
    .prepare(`UPDATE recurring_expenses SET ${fields.join(", ")} WHERE id = ?`)
    .run(...params, id);

  return db()
    .prepare("SELECT * FROM recurring_expenses WHERE id = ?")
    .get(id) as RecurringExpense;
}

export function deleteRecurringExpense(id: number): void {
  db().prepare("DELETE FROM recurring_expenses WHERE id = ?").run(id);
}
