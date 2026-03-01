import Papa from "papaparse";
import type { CsvProfile } from "@/lib/types";

export interface ParsedCsvRow {
  date: string; // ISO date YYYY-MM-DD
  description: string;
  amount: number;
  rawDate: string;
  rawDescription: string;
  rawAmount: string;
  rowIndex: number;
}

export interface CsvParseResult {
  rows: ParsedCsvRow[];
  headers: string[];
  errors: string[];
  skippedCount: number;
}

function parseDate(raw: string, format: string): string | null {
  const cleaned = raw.trim();
  if (!cleaned) return null;

  // Try common formats
  if (format === "MM/DD/YYYY" || format === "M/D/YYYY") {
    const match = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
    if (match) {
      const m = match[1].padStart(2, "0");
      const d = match[2].padStart(2, "0");
      const y = match[3].length === 2 ? `20${match[3]}` : match[3];
      return `${y}-${m}-${d}`;
    }
  }

  if (format === "YYYY-MM-DD") {
    const match = cleaned.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) return cleaned;
  }

  if (format === "MM-DD-YYYY") {
    const match = cleaned.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (match) return `${match[3]}-${match[1]}-${match[2]}`;
  }

  // Fallback: try Date.parse
  const parsed = new Date(cleaned);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return null;
}

function parseAmount(raw: string, amountSign: "positive" | "negative"): number | null {
  const cleaned = raw.replace(/[$,"\s]/g, "").trim();
  if (!cleaned) return null;

  const num = parseFloat(cleaned);
  if (isNaN(num)) return null;

  // Some banks use negative for charges, positive for payments/credits
  const amount = amountSign === "negative" ? -num : num;

  // Only return positive amounts (expenses)
  return amount > 0 ? Math.round(amount * 100) / 100 : null;
}

export function parseCsvWithProfile(
  csvContent: string,
  profile: CsvProfile
): CsvParseResult {
  const result = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
  });

  const headers = result.meta.fields || [];
  const rows: ParsedCsvRow[] = [];
  const errors: string[] = [];
  let skippedCount = 0;

  // Validate that required columns exist
  if (!headers.includes(profile.date_column)) {
    errors.push(`Date column "${profile.date_column}" not found in CSV. Available: ${headers.join(", ")}`);
    return { rows: [], headers, errors, skippedCount: 0 };
  }
  if (!headers.includes(profile.description_column)) {
    errors.push(`Description column "${profile.description_column}" not found in CSV`);
    return { rows: [], headers, errors, skippedCount: 0 };
  }
  if (!headers.includes(profile.amount_column)) {
    errors.push(`Amount column "${profile.amount_column}" not found in CSV`);
    return { rows: [], headers, errors, skippedCount: 0 };
  }

  const dataRows = result.data as Record<string, string>[];

  for (let i = 0; i < dataRows.length; i++) {
    if (i < profile.skip_rows) {
      skippedCount++;
      continue;
    }

    const row = dataRows[i];
    const rawDate = row[profile.date_column] || "";
    const rawDescription = row[profile.description_column] || "";
    const rawAmount = row[profile.amount_column] || "";

    const date = parseDate(rawDate, profile.date_format);
    const amount = parseAmount(rawAmount, profile.amount_sign as "positive" | "negative");

    if (!date) {
      skippedCount++;
      continue;
    }

    if (amount === null || amount <= 0) {
      skippedCount++;
      continue;
    }

    if (!rawDescription.trim()) {
      skippedCount++;
      continue;
    }

    rows.push({
      date,
      description: rawDescription.trim(),
      amount,
      rawDate,
      rawDescription: rawDescription.trim(),
      rawAmount,
      rowIndex: i,
    });
  }

  return { rows, headers, errors, skippedCount };
}

export function detectCsvColumns(csvContent: string): {
  headers: string[];
  sampleRows: Record<string, string>[];
  suggestedProfile: Partial<CsvProfile> | null;
} {
  const result = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
    preview: 5,
  });

  const headers = result.meta.fields || [];
  const sampleRows = result.data as Record<string, string>[];

  // Try to auto-detect columns
  let dateColumn: string | null = null;
  let descriptionColumn: string | null = null;
  let amountColumn: string | null = null;

  for (const h of headers) {
    const lower = h.toLowerCase();
    if (!dateColumn && (lower.includes("date") || lower === "posted" || lower.includes("trans"))) {
      dateColumn = h;
    }
    if (!descriptionColumn && (lower.includes("desc") || lower.includes("merchant") || lower.includes("memo") || lower.includes("name"))) {
      descriptionColumn = h;
    }
    if (!amountColumn && (lower.includes("amount") || lower.includes("debit") || lower.includes("charge"))) {
      amountColumn = h;
    }
  }

  const suggestedProfile =
    dateColumn && descriptionColumn && amountColumn
      ? {
          date_column: dateColumn,
          description_column: descriptionColumn,
          amount_column: amountColumn,
          date_format: "MM/DD/YYYY",
          amount_sign: "positive" as const,
        }
      : null;

  return { headers, sampleRows, suggestedProfile };
}
