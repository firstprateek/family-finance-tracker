import { getDb } from "@/lib/db";
import { ensureDbInitialized } from "@/lib/db/init";
import type { Expense } from "@/lib/types";

export interface MatchCandidate {
  manualExpense: Expense;
  csvExpense: Expense;
  confidence: number;
  scores: {
    amount: number;
    date: number;
    description: number;
  };
}

export interface ReconciliationResult {
  autoMatched: MatchCandidate[];
  suggested: MatchCandidate[];
  unmatchedCsv: Expense[];
  unmatchedManual: Expense[];
  totalCsvRows: number;
}

const WEIGHTS = {
  amount: 0.5,
  date: 0.3,
  description: 0.2,
};

const THRESHOLDS = {
  autoMatch: 0.85,
  suggest: 0.5,
};

function scoreAmount(a: number, b: number): number {
  if (Math.abs(a - b) < 0.01) return 1.0;
  const diff = Math.abs(a - b) / Math.max(a, b);
  if (diff <= 0.01) return 0.95;
  if (diff <= 0.05) return 0.8;
  if (diff <= 0.1) return 0.5;
  return 0;
}

function scoreDate(dateA: string, dateB: string): number {
  const a = new Date(dateA + "T00:00:00");
  const b = new Date(dateB + "T00:00:00");
  const diffDays = Math.abs(
    Math.round((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24))
  );

  if (diffDays === 0) return 1.0;
  if (diffDays === 1) return 0.9;
  if (diffDays === 2) return 0.75;
  if (diffDays === 3) return 0.5;
  if (diffDays <= 5) return 0.25;
  return 0;
}

function normalizeDescription(desc: string): string {
  return desc
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(s: string): Set<string> {
  return new Set(
    normalizeDescription(s)
      .split(" ")
      .filter((t) => t.length > 2)
  );
}

function scoreDescription(a: string, b: string): number {
  const normA = normalizeDescription(a);
  const normB = normalizeDescription(b);

  // Direct containment
  if (normA.includes(normB) || normB.includes(normA)) return 0.9;

  // Token overlap (Jaccard similarity)
  const tokensA = tokenize(a);
  const tokensB = tokenize(b);

  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  const intersection = new Set([...tokensA].filter((t) => tokensB.has(t)));
  const union = new Set([...tokensA, ...tokensB]);

  return intersection.size / union.size;
}

function computeConfidence(
  csvExpense: Expense,
  manualExpense: Expense
): { confidence: number; scores: { amount: number; date: number; description: number } } {
  const scores = {
    amount: scoreAmount(csvExpense.amount, manualExpense.amount),
    date: scoreDate(csvExpense.date, manualExpense.date),
    description: scoreDescription(csvExpense.description, manualExpense.description),
  };

  const confidence =
    scores.amount * WEIGHTS.amount +
    scores.date * WEIGHTS.date +
    scores.description * WEIGHTS.description;

  return { confidence, scores };
}

export function runReconciliation(batchId: number): ReconciliationResult {
  ensureDbInitialized();
  const db = getDb();

  // Get all CSV expenses from this batch
  const csvExpenses = db
    .prepare(
      `SELECT * FROM expenses
       WHERE import_batch_id = ? AND source = 'csv_import'
       ORDER BY date ASC`
    )
    .all(batchId) as Expense[];

  if (csvExpenses.length === 0) {
    return {
      autoMatched: [],
      suggested: [],
      unmatchedCsv: [],
      unmatchedManual: [],
      totalCsvRows: 0,
    };
  }

  // Determine the date range from CSV expenses (with 5-day buffer)
  const dates = csvExpenses.map((e) => e.date).sort();
  const minDate = dates[0];
  const maxDate = dates[dates.length - 1];

  // Get candidate manual expenses in that date range (with buffer)
  const manualExpenses = db
    .prepare(
      `SELECT * FROM expenses
       WHERE (source = 'manual' OR source = 'recurring')
         AND match_status = 'unmatched'
         AND date >= date(?, '-5 days')
         AND date <= date(?, '+5 days')
       ORDER BY date ASC`
    )
    .all(minDate, maxDate) as Expense[];

  const autoMatched: MatchCandidate[] = [];
  const suggested: MatchCandidate[] = [];
  const matchedManualIds = new Set<number>();
  const matchedCsvIds = new Set<number>();

  // Score all pairs
  const allCandidates: MatchCandidate[] = [];

  for (const csvExp of csvExpenses) {
    for (const manualExp of manualExpenses) {
      const { confidence, scores } = computeConfidence(csvExp, manualExp);
      if (confidence >= THRESHOLDS.suggest) {
        allCandidates.push({
          csvExpense: csvExp,
          manualExpense: manualExp,
          confidence,
          scores,
        });
      }
    }
  }

  // Sort by confidence descending — greedy one-to-one assignment
  allCandidates.sort((a, b) => b.confidence - a.confidence);

  for (const candidate of allCandidates) {
    if (
      matchedCsvIds.has(candidate.csvExpense.id) ||
      matchedManualIds.has(candidate.manualExpense.id)
    ) {
      continue;
    }

    matchedCsvIds.add(candidate.csvExpense.id);
    matchedManualIds.add(candidate.manualExpense.id);

    if (candidate.confidence >= THRESHOLDS.autoMatch) {
      autoMatched.push(candidate);

      // Update DB: link the two expenses
      db.prepare(
        `UPDATE expenses SET match_status = 'matched', matched_with_id = ?, match_confidence = ? WHERE id = ?`
      ).run(candidate.manualExpense.id, candidate.confidence, candidate.csvExpense.id);

      db.prepare(
        `UPDATE expenses SET match_status = 'matched', matched_with_id = ?, match_confidence = ? WHERE id = ?`
      ).run(candidate.csvExpense.id, candidate.confidence, candidate.manualExpense.id);
    } else {
      suggested.push(candidate);
    }
  }

  // Unmatched
  const unmatchedCsv = csvExpenses.filter((e) => !matchedCsvIds.has(e.id));
  const unmatchedManual = manualExpenses.filter(
    (e) => !matchedManualIds.has(e.id)
  );

  // Update batch counts
  db.prepare(
    `UPDATE csv_import_batches SET matched_count = ?, unmatched_count = ?, status = 'review' WHERE id = ?`
  ).run(autoMatched.length + suggested.length, unmatchedCsv.length, batchId);

  return {
    autoMatched,
    suggested,
    unmatchedCsv,
    unmatchedManual,
    totalCsvRows: csvExpenses.length,
  };
}

export function confirmMatch(csvId: number, manualId: number): void {
  ensureDbInitialized();
  const db = getDb();

  db.prepare(
    `UPDATE expenses SET match_status = 'confirmed', matched_with_id = ? WHERE id = ?`
  ).run(manualId, csvId);

  db.prepare(
    `UPDATE expenses SET match_status = 'confirmed', matched_with_id = ? WHERE id = ?`
  ).run(csvId, manualId);
}

export function rejectMatch(csvId: number, manualId: number): void {
  ensureDbInitialized();
  const db = getDb();

  db.prepare(
    `UPDATE expenses SET match_status = 'unmatched', matched_with_id = NULL, match_confidence = NULL WHERE id = ?`
  ).run(csvId);

  db.prepare(
    `UPDATE expenses SET match_status = 'unmatched', matched_with_id = NULL, match_confidence = NULL WHERE id = ?`
  ).run(manualId);
}
