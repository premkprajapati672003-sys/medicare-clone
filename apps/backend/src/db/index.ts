import { drizzle } from 'drizzle-orm/bun-sqlite';
import { Database } from 'bun:sqlite';
import * as schema from './schema';
import { join } from 'path';

// Resolve database path relative to this source file so it's always in apps/backend/hotdoc.db
const dbPath = join(import.meta.dir, '../../hotdoc.db');
const sqlite = new Database(dbPath, { create: true });
export const db = drizzle(sqlite, { schema });

