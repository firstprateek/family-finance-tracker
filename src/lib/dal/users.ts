import { getDb } from "@/lib/db";
import { ensureDbInitialized } from "@/lib/db/init";
import type { User } from "@/lib/types";

function db() {
  ensureDbInitialized();
  return getDb();
}

export function getUsers(): User[] {
  return db()
    .prepare("SELECT * FROM users ORDER BY created_at ASC")
    .all() as User[];
}

export function getUserById(id: string): User | undefined {
  return db()
    .prepare("SELECT * FROM users WHERE id = ?")
    .get(id) as User | undefined;
}

export function createUser(data: {
  id: string;
  display_name: string;
  income?: number;
  pin_hash?: string;
}): User {
  db()
    .prepare(
      "INSERT INTO users (id, display_name, income, pin_hash) VALUES (?, ?, ?, ?)"
    )
    .run(data.id, data.display_name, data.income || 0, data.pin_hash || null);

  return db()
    .prepare("SELECT * FROM users WHERE id = ?")
    .get(data.id) as User;
}

export function updateUser(
  id: string,
  data: { display_name?: string; income?: number; pin_hash?: string }
): User {
  const fields: string[] = [];
  const params: (string | number | null)[] = [];

  if (data.display_name !== undefined) { fields.push("display_name = ?"); params.push(data.display_name); }
  if (data.income !== undefined) { fields.push("income = ?"); params.push(data.income); }
  if (data.pin_hash !== undefined) { fields.push("pin_hash = ?"); params.push(data.pin_hash); }

  fields.push("updated_at = datetime('now')");

  if (fields.length > 1) {
    db()
      .prepare(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`)
      .run(...params, id);
  }

  return db().prepare("SELECT * FROM users WHERE id = ?").get(id) as User;
}

export function deleteUser(id: string): void {
  db().prepare("DELETE FROM users WHERE id = ?").run(id);
}

export function getSetting(key: string): string | undefined {
  const row = db()
    .prepare("SELECT value FROM settings WHERE key = ?")
    .get(key) as { value: string } | undefined;
  return row?.value;
}

export function setSetting(key: string, value: string): void {
  db()
    .prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)")
    .run(key, value);
}
