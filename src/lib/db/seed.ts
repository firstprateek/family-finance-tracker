import { getDb } from "./index";

const DEFAULT_CATEGORIES = [
  { name: "Groceries", icon: "shopping-cart", color: "#22c55e", sort_order: 1 },
  { name: "Dining Out", icon: "utensils", color: "#f97316", sort_order: 2 },
  { name: "Transportation", icon: "car", color: "#3b82f6", sort_order: 3 },
  { name: "Utilities", icon: "zap", color: "#eab308", sort_order: 4 },
  { name: "Rent / Mortgage", icon: "home", color: "#8b5cf6", sort_order: 5 },
  { name: "Entertainment", icon: "film", color: "#ec4899", sort_order: 6 },
  { name: "Health", icon: "heart", color: "#ef4444", sort_order: 7 },
  { name: "Shopping", icon: "shopping-bag", color: "#14b8a6", sort_order: 8 },
  { name: "Subscriptions", icon: "repeat", color: "#6366f1", sort_order: 9 },
  { name: "Insurance", icon: "shield", color: "#64748b", sort_order: 10 },
  { name: "Travel", icon: "plane", color: "#0ea5e9", sort_order: 11 },
  { name: "Personal Care", icon: "scissors", color: "#d946ef", sort_order: 12 },
  { name: "Gifts", icon: "gift", color: "#f43f5e", sort_order: 13 },
  { name: "Education", icon: "book-open", color: "#0d9488", sort_order: 14 },
  { name: "Other", icon: "more-horizontal", color: "#9ca3af", sort_order: 99 },
];

export function seedDatabase() {
  const db = getDb();

  const existingCategories = db
    .prepare("SELECT COUNT(*) as count FROM categories")
    .get() as { count: number };

  if (existingCategories.count === 0) {
    const insertCategory = db.prepare(
      "INSERT INTO categories (name, icon, color, is_system, sort_order) VALUES (?, ?, ?, 1, ?)"
    );
    const insertMany = db.transaction(() => {
      for (const cat of DEFAULT_CATEGORIES) {
        insertCategory.run(cat.name, cat.icon, cat.color, cat.sort_order);
      }
    });
    insertMany();
  }

  // Insert default split mode setting
  db.prepare(
    "INSERT OR IGNORE INTO settings (key, value) VALUES ('split_mode', 'income_ratio')"
  ).run();

  db.prepare(
    "INSERT OR IGNORE INTO settings (key, value) VALUES ('currency', 'USD')"
  ).run();

  db.prepare(
    "INSERT OR IGNORE INTO settings (key, value) VALUES ('currency_symbol', '$')"
  ).run();
}
