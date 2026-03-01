export type ExpenseSource = "manual" | "recurring" | "csv_import";
export type MatchStatus = "unmatched" | "matched" | "confirmed";
export type RecurrenceFrequency = "monthly" | "weekly" | "biweekly" | "yearly";
export type ImportBatchStatus = "pending" | "processing" | "review" | "completed";
export type SettlementDirection = "settled" | string; // e.g., "alice_to_bob"
export type SplitMode = "income_ratio" | "equal";

export interface User {
  id: string;
  display_name: string;
  income: number;
  pin_hash: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  icon: string | null;
  color: string | null;
  is_system: number;
  sort_order: number;
  created_at: string;
}

export interface Expense {
  id: number;
  date: string;
  description: string;
  category_id: number;
  amount: number;
  paid_by: string;
  notes: string | null;
  source: ExpenseSource;
  recurring_id: number | null;
  import_batch_id: number | null;
  match_status: MatchStatus;
  matched_with_id: number | null;
  match_confidence: number | null;
  is_excluded: number;
  created_at: string;
  updated_at: string;
}

export interface ExpenseWithCategory extends Expense {
  category_name: string;
  category_icon: string | null;
  category_color: string | null;
}

export interface RecurringExpense {
  id: number;
  description: string;
  category_id: number;
  amount: number;
  paid_by: string;
  frequency: RecurrenceFrequency;
  day_of_month: number | null;
  start_date: string;
  end_date: string | null;
  is_active: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CsvImportBatch {
  id: number;
  filename: string;
  card_label: string | null;
  imported_by: string;
  row_count: number;
  matched_count: number;
  unmatched_count: number;
  status: ImportBatchStatus;
  month: string | null;
  created_at: string;
}

export interface CsvProfile {
  id: number;
  name: string;
  date_column: string;
  description_column: string;
  amount_column: string;
  date_format: string;
  amount_sign: "positive" | "negative";
  skip_rows: number;
  created_at: string;
}

export interface MonthlySummary {
  id: number;
  month: string;
  total_expenses: number;
  user1_paid: number;
  user2_paid: number;
  user1_share: number;
  user2_share: number;
  settlement_amount: number;
  settlement_direction: string | null;
  income_ratio: string | null;
  is_finalized: number;
  computed_at: string;
}

export interface CreateExpenseInput {
  date: string;
  description: string;
  category_id: number;
  amount: number;
  paid_by: string;
  notes?: string;
  source?: ExpenseSource;
  recurring_id?: number;
  import_batch_id?: number;
}

export interface UpdateExpenseInput {
  date?: string;
  description?: string;
  category_id?: number;
  amount?: number;
  paid_by?: string;
  notes?: string;
  is_excluded?: number;
}

export interface SettlementResult {
  totalExpenses: number;
  contributions: Record<string, number>;
  shares: Record<string, number>;
  incomes: Record<string, number>;
  incomeRatios: Record<string, number>;
  settlementAmount: number;
  settlementFrom: string | null;
  settlementTo: string | null;
}
