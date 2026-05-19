import { Database } from "bun:sqlite";
import { join } from "path";

const dbPath = join(import.meta.dir, "hotdoc.db");
const db = new Database(dbPath);


db.run(`
  CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY NOT NULL,
    patient_id TEXT NOT NULL,
    uploader_id TEXT NOT NULL,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    size TEXT NOT NULL,
    type TEXT NOT NULL,
    category TEXT,
    description TEXT,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (patient_id) REFERENCES users(id),
    FOREIGN KEY (uploader_id) REFERENCES users(id)
  );
`);

console.log("Migration complete!");
