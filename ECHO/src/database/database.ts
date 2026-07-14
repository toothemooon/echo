import * as SQLite from "expo-sqlite";

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;

  db = await SQLite.openDatabaseAsync("echo.db");

  // Enable WAL mode for better performance with large datasets
  await db.execAsync("PRAGMA journal_mode = WAL;");
  await db.execAsync("PRAGMA synchronous = NORMAL;");

  // Drop and recreate tables to ensure clean schema.
  // This is safe because all data is synced from quotes.json on every launch,
  // and saved quotes / history are kept in-memory only.
  await db.execAsync(`
    DROP TABLE IF EXISTS quote_categories;
    DROP TABLE IF EXISTS quotes;
    -- Note: saved_quotes is NOT dropped — it preserves user bookmarks across restarts

    CREATE TABLE quotes (
      id               INTEGER PRIMARY KEY,
      text             TEXT    NOT NULL,
      author           TEXT    NOT NULL,
      role             TEXT    NOT NULL DEFAULT '',
      primary_category TEXT    NOT NULL,
      created_at       TEXT    DEFAULT (datetime('now'))
    );

    CREATE INDEX idx_quotes_category ON quotes(primary_category);

    CREATE TABLE quote_categories (
      quote_id INTEGER NOT NULL,
      category TEXT    NOT NULL,
      PRIMARY KEY (quote_id, category),
      FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE
    );

    CREATE INDEX idx_qc_category ON quote_categories(category);

    CREATE TABLE IF NOT EXISTS saved_quotes (
      quote_id INTEGER PRIMARY KEY,
      saved_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE
    );
  `);

  return db;
}
