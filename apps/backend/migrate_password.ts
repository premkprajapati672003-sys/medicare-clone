import { Database } from "bun:sqlite";
import { join } from "path";

const dbPath = join(import.meta.dir, "hotdoc.db");
const db = new Database(dbPath);

try {
  // Alter users table to add password column
  db.run("ALTER TABLE users ADD COLUMN password TEXT;");
  console.log("Column 'password' added successfully to users table!");
} catch (e: any) {
  if (e.message && e.message.includes("duplicate column name") || e.message.includes("already exists")) {
    console.log("Column 'password' already exists.");
  } else {
    console.error("Migration error:", e.message);
  }
}
