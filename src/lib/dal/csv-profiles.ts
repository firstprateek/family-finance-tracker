import { getDb } from "@/lib/db";
import { ensureDbInitialized } from "@/lib/db/init";
import type { CsvProfile } from "@/lib/types";

function db() {
  ensureDbInitialized();
  return getDb();
}

export function getCsvProfiles(): CsvProfile[] {
  return db()
    .prepare("SELECT * FROM csv_profiles ORDER BY name ASC")
    .all() as CsvProfile[];
}

export function getCsvProfileById(id: number): CsvProfile | undefined {
  return db()
    .prepare("SELECT * FROM csv_profiles WHERE id = ?")
    .get(id) as CsvProfile | undefined;
}

export function createCsvProfile(data: {
  name: string;
  date_column: string;
  description_column: string;
  amount_column: string;
  date_format?: string;
  amount_sign?: "positive" | "negative";
  skip_rows?: number;
}): CsvProfile {
  const result = db()
    .prepare(
      `INSERT INTO csv_profiles (name, date_column, description_column, amount_column, date_format, amount_sign, skip_rows)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      data.name,
      data.date_column,
      data.description_column,
      data.amount_column,
      data.date_format || "MM/DD/YYYY",
      data.amount_sign || "positive",
      data.skip_rows || 0
    );

  return db()
    .prepare("SELECT * FROM csv_profiles WHERE id = ?")
    .get(result.lastInsertRowid) as CsvProfile;
}

export function deleteCsvProfile(id: number): void {
  db().prepare("DELETE FROM csv_profiles WHERE id = ?").run(id);
}
