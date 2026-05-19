import { Database } from "bun:sqlite";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

const dbPath = join(import.meta.dir, "hotdoc.db");
const db = new Database(dbPath, { create: true });
const drizzleDir = join(import.meta.dir, "drizzle");

const files = readdirSync(drizzleDir).filter(f => f.endsWith('.sql'));

if (files.length === 0) {
  console.log("No migration files found.");
  process.exit(0);
}

for (const file of files.sort()) {
  const migration = readFileSync(join(drizzleDir, file), "utf-8");
  db.exec(migration);
  console.log(`Migration ${file} applied successfully.`);
}
