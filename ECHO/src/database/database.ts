import * as SQLite from "expo-sqlite";

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;

  db = await SQLite.openDatabaseAsync("echo.db");

  // Enable WAL mode for better performance with large datasets
  await db.execAsync("PRAGMA journal_mode = WAL;");
  await db.execAsync("PRAGMA synchronous = NORMAL;");

  // Create tables
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS quotes (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      text       TEXT    NOT NULL,
      author     TEXT    NOT NULL,
      category   TEXT    NOT NULL,
      created_at TEXT    DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_quotes_category ON quotes(category);
  `);

  return db;
}
