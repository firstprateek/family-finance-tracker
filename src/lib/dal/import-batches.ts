import { getDb } from "@/lib/db";
import { ensureDbInitialized } from "@/lib/db/init";
import type { CsvImportBatch } from "@/lib/types";

function db() {
  ensureDbInitialized();
  return getDb();
}

export function getImportBatches(): CsvImportBatch[] {
  return db()
    .prepare("SELECT * FROM csv_import_batches ORDER BY created_at DESC")
    .all() as CsvImportBatch[];
}

export function getImportBatchById(id: number): CsvImportBatch | undefined {
  return db()
    .prepare("SELECT * FROM csv_import_batches WHERE id = ?")
    .get(id) as CsvImportBatch | undefined;
}

export function createImportBatch(data: {
  filename: string;
  card_label?: string;
  imported_by: string;
  row_count: number;
  month?: string;
}): CsvImportBatch {
  const result = db()
    .prepare(
      `INSERT INTO csv_import_batches (filename, card_label, imported_by, row_count, unmatched_count, month)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(
      data.filename,
      data.card_label || null,
      data.imported_by,
      data.row_count,
      data.row_count,
      data.month || null
    );

  return db()
    .prepare("SELECT * FROM csv_import_batches WHERE id = ?")
    .get(result.lastInsertRowid) as CsvImportBatch;
}

export function updateImportBatch(
  id: number,
  data: Partial<{
    matched_count: number;
    unmatched_count: number;
    status: string;
  }>
): void {
  const fields: string[] = [];
  const params: (string | number)[] = [];

  if (data.matched_count !== undefined) { fields.push("matched_count = ?"); params.push(data.matched_count); }
  if (data.unmatched_count !== undefined) { fields.push("unmatched_count = ?"); params.push(data.unmatched_count); }
  if (data.status !== undefined) { fields.push("status = ?"); params.push(data.status); }

  if (fields.length > 0) {
    db()
      .prepare(`UPDATE csv_import_batches SET ${fields.join(", ")} WHERE id = ?`)
      .run(...params, id);
  }
}
