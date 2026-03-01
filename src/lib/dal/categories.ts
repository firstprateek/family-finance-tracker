import { getDb } from "@/lib/db";
import { ensureDbInitialized } from "@/lib/db/init";
import type { Category } from "@/lib/types";

function db() {
  ensureDbInitialized();
  return getDb();
}

export function getCategories(): Category[] {
  return db()
    .prepare("SELECT * FROM categories ORDER BY sort_order ASC, name ASC")
    .all() as Category[];
}

export function getCategoryById(id: number): Category | undefined {
  return db()
    .prepare("SELECT * FROM categories WHERE id = ?")
    .get(id) as Category | undefined;
}

export function createCategory(data: {
  name: string;
  icon?: string;
  color?: string;
}): Category {
  const maxOrder = db()
    .prepare("SELECT MAX(sort_order) as max_order FROM categories")
    .get() as { max_order: number | null };

  const result = db()
    .prepare(
      "INSERT INTO categories (name, icon, color, is_system, sort_order) VALUES (?, ?, ?, 0, ?)"
    )
    .run(data.name, data.icon || null, data.color || null, (maxOrder.max_order || 0) + 1);

  return db()
    .prepare("SELECT * FROM categories WHERE id = ?")
    .get(result.lastInsertRowid) as Category;
}

export function updateCategory(
  id: number,
  data: { name?: string; icon?: string; color?: string; sort_order?: number }
): Category {
  const fields: string[] = [];
  const params: (string | number | null)[] = [];

  if (data.name !== undefined) { fields.push("name = ?"); params.push(data.name); }
  if (data.icon !== undefined) { fields.push("icon = ?"); params.push(data.icon); }
  if (data.color !== undefined) { fields.push("color = ?"); params.push(data.color); }
  if (data.sort_order !== undefined) { fields.push("sort_order = ?"); params.push(data.sort_order); }

  if (fields.length > 0) {
    db()
      .prepare(`UPDATE categories SET ${fields.join(", ")} WHERE id = ?`)
      .run(...params, id);
  }

  return db().prepare("SELECT * FROM categories WHERE id = ?").get(id) as Category;
}

export function deleteCategory(id: number): void {
  const category = getCategoryById(id);
  if (category?.is_system) {
    throw new Error("Cannot delete system categories");
  }
  db().prepare("DELETE FROM categories WHERE id = ?").run(id);
}
