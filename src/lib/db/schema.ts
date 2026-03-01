import { getDb } from "./index";

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  display_name  TEXT NOT NULL,
  income        REAL NOT NULL DEFAULT 0,
  pin_hash      TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS categories (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL UNIQUE,
  icon          TEXT,
  color         TEXT,
  is_system     INTEGER NOT NULL DEFAULT 0,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS recurring_expenses (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  description   TEXT NOT NULL,
  category_id   INTEGER NOT NULL REFERENCES categories(id),
  amount        REAL NOT NULL,
  paid_by       TEXT NOT NULL REFERENCES users(id),
  frequency     TEXT NOT NULL DEFAULT 'monthly',
  day_of_month  INTEGER,
  start_date    TEXT NOT NULL,
  end_date      TEXT,
  is_active     INTEGER NOT NULL DEFAULT 1,
  notes         TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS csv_import_batches (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  filename        TEXT NOT NULL,
  card_label      TEXT,
  imported_by     TEXT NOT NULL REFERENCES users(id),
  row_count       INTEGER NOT NULL DEFAULT 0,
  matched_count   INTEGER NOT NULL DEFAULT 0,
  unmatched_count INTEGER NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'pending',
  month           TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS expenses (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  date            TEXT NOT NULL,
  description     TEXT NOT NULL,
  category_id     INTEGER NOT NULL REFERENCES categories(id),
  amount          REAL NOT NULL,
  paid_by         TEXT NOT NULL REFERENCES users(id),
  notes           TEXT,
  source          TEXT NOT NULL DEFAULT 'manual',
  recurring_id    INTEGER REFERENCES recurring_expenses(id),
  import_batch_id INTEGER REFERENCES csv_import_batches(id),
  match_status    TEXT DEFAULT 'unmatched',
  matched_with_id INTEGER REFERENCES expenses(id),
  match_confidence REAL,
  is_excluded     INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS csv_profiles (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  name            TEXT NOT NULL UNIQUE,
  date_column     TEXT NOT NULL,
  description_column TEXT NOT NULL,
  amount_column   TEXT NOT NULL,
  date_format     TEXT NOT NULL DEFAULT 'MM/DD/YYYY',
  amount_sign     TEXT NOT NULL DEFAULT 'positive',
  skip_rows       INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS monthly_summaries (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  month           TEXT NOT NULL UNIQUE,
  total_expenses  REAL NOT NULL DEFAULT 0,
  user1_paid      REAL NOT NULL DEFAULT 0,
  user2_paid      REAL NOT NULL DEFAULT 0,
  user1_share     REAL NOT NULL DEFAULT 0,
  user2_share     REAL NOT NULL DEFAULT 0,
  settlement_amount REAL NOT NULL DEFAULT 0,
  settlement_direction TEXT,
  income_ratio    TEXT,
  is_finalized    INTEGER NOT NULL DEFAULT 0,
  computed_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_paid_by ON expenses(paid_by);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_source ON expenses(source);
CREATE INDEX IF NOT EXISTS idx_expenses_match_status ON expenses(match_status);
CREATE INDEX IF NOT EXISTS idx_expenses_month ON expenses(substr(date, 1, 7));
CREATE INDEX IF NOT EXISTS idx_expenses_import_batch ON expenses(import_batch_id);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`;

export function runMigrations() {
  const db = getDb();
  db.exec(SCHEMA_SQL);
}
