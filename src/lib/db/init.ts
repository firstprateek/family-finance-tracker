import { runMigrations } from "./schema";
import { seedDatabase } from "./seed";

let initialized = false;

export function ensureDbInitialized() {
  if (initialized) return;
  runMigrations();
  seedDatabase();
  initialized = true;
}
