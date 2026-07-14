import { getDatabase } from "./database";

export interface Quote {
  id: number;
  text: string;
  author: string;
  category: string;
}

/**
 * Get a random quote from the database.
 */
export async function getRandomQuote(): Promise<Quote | null> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Quote>(
    "SELECT id, text, author, category FROM quotes ORDER BY RANDOM() LIMIT 1",
  );
  return rows[0] ?? null;
}

/**
 * Get quotes with pagination (limit + offset).
 * Useful for displaying a subset or for virtualized lists.
 */
export async function getQuotes(
  limit: number = 50,
  offset: number = 0,
): Promise<Quote[]> {
  const db = await getDatabase();
  return db.getAllAsync<Quote>(
    "SELECT id, text, author, category FROM quotes ORDER BY id ASC LIMIT ? OFFSET ?",
    [limit, offset],
  );
}

/**
 * Get quotes filtered by category with pagination.
 */
export async function getQuotesByCategory(
  category: string,
  limit: number = 50,
  offset: number = 0,
): Promise<Quote[]> {
  const db = await getDatabase();
  return db.getAllAsync<Quote>(
    "SELECT id, text, author, category FROM quotes WHERE category = ? ORDER BY id ASC LIMIT ? OFFSET ?",
    [category, limit, offset],
  );
}

/**
 * Get total number of quotes (or per category).
 */
export async function getQuoteCount(category?: string): Promise<number> {
  const db = await getDatabase();
  if (category) {
    const row = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM quotes WHERE category = ?",
      [category],
    );
    return row?.count ?? 0;
  }
  const row = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM quotes",
  );
  return row?.count ?? 0;
}

/**
 * Check if the quotes table has any data.
 */
export async function hasQuotes(): Promise<boolean> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM quotes",
  );
  return (row?.count ?? 0) > 0;
}

/**
 * Bulk insert quotes in batches of 1000 (transaction-wrapped).
 */
export async function insertQuotes(quotes: Omit<Quote, "id">[]): Promise<void> {
  const db = await getDatabase();
  const BATCH_SIZE = 1000;

  for (let i = 0; i < quotes.length; i += BATCH_SIZE) {
    const batch = quotes.slice(i, i + BATCH_SIZE);
    const placeholders = batch.map(() => "(?, ?, ?)").join(", ");
    const values = batch.flatMap((q) => [q.text, q.author, q.category]);

    await db.runAsync(
      `INSERT INTO quotes (text, author, category) VALUES ${placeholders}`,
      values,
    );
  }
}
