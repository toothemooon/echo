import { getDatabase } from "./database";

export interface Quote {
  id: number;
  text: string;
  author: string;
  role: string;
  primary_category: string;
  categories: string[];
}

/**
 * Get a random quote from the database, optionally filtered by categories.
 */
export async function getRandomQuote(
  preferredCategories?: string[],
): Promise<Quote | null> {
  const db = await getDatabase();
  let rows: Quote[];

  if (preferredCategories && preferredCategories.length > 0) {
    const placeholders = preferredCategories.map(() => "?").join(", ");
    rows = await db.getAllAsync<Quote>(
      `SELECT q.id, q.text, q.author, q.role, q.primary_category
       FROM quotes q
       WHERE q.primary_category IN (${placeholders})
       ORDER BY RANDOM() LIMIT 1`,
      preferredCategories,
    );
  } else {
    rows = await db.getAllAsync<Quote>(
      "SELECT id, text, author, role, primary_category FROM quotes ORDER BY RANDOM() LIMIT 1",
    );
  }

  if (rows.length === 0) return null;
  const quote = rows[0];
  quote.categories = await getQuoteCategories(quote.id);
  return quote;
}

/**
 * Get a "Daily Five" — one random quote from each preferred category,
 * backfilling from all categories if needed.
 */
export async function getDailyFive(
  preferredCategories: string[],
): Promise<Quote[]> {
  const db = await getDatabase();
  const result: Quote[] = [];
  const seenIds = new Set<number>();

  // One from each preferred category
  for (const cat of preferredCategories) {
    if (result.length >= 5) break;
    const rows = await db.getAllAsync<Quote>(
      "SELECT id, text, author, role, primary_category FROM quotes WHERE primary_category = ? AND id NOT IN (SELECT id FROM quotes WHERE 0=1) ORDER BY RANDOM() LIMIT 1",
      [cat],
    );
    // Simpler: just use a subquery approach
    const quote = await db.getFirstAsync<Quote>(
      "SELECT id, text, author, role, primary_category FROM quotes WHERE primary_category = ? ORDER BY RANDOM() LIMIT 1",
      [cat],
    );
    if (quote && !seenIds.has(quote.id)) {
      seenIds.add(quote.id);
      quote.categories = await getQuoteCategories(quote.id);
      result.push(quote);
    }
  }

  // Backfill if less than 5
  if (result.length < 5) {
    const remaining = await db.getAllAsync<Quote>(
      `SELECT id, text, author, role, primary_category FROM quotes
       WHERE id NOT IN (${
         seenIds.size > 0
           ? Array.from(seenIds)
               .map(() => "?")
               .join(", ")
           : "0"
       })
       ORDER BY RANDOM() LIMIT ?`,
      [...seenIds, 5 - result.length],
    );
    for (const q of remaining) {
      if (result.length >= 5) break;
      if (!seenIds.has(q.id)) {
        seenIds.add(q.id);
        q.categories = await getQuoteCategories(q.id);
        result.push(q);
      }
    }
  }

  return result;
}

/**
 * Get categories for a specific quote.
 */
export async function getQuoteCategories(quoteId: number): Promise<string[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ category: string }>(
    "SELECT category FROM quote_categories WHERE quote_id = ?",
    [quoteId],
  );
  return rows.map((r) => r.category);
}

/**
 * Get total number of quotes.
 */
export async function getQuoteCount(): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM quotes",
  );
  return row?.count ?? 0;
}

/**
 * Add a quote to saved collection.
 */
export async function addSavedQuote(quoteId: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    "INSERT OR IGNORE INTO saved_quotes (quote_id) VALUES (?)",
    [quoteId],
  );
}

/**
 * Remove a quote from saved collection.
 */
export async function removeSavedQuote(quoteId: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync("DELETE FROM saved_quotes WHERE quote_id = ?", [quoteId]);
}

/**
 * Check if a quote is saved.
 */
export async function isQuoteSaved(quoteId: number): Promise<boolean> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM saved_quotes WHERE quote_id = ?",
    [quoteId],
  );
  return (row?.count ?? 0) > 0;
}

/**
 * Get all saved quotes with full data.
 */
export async function getSavedQuotes(): Promise<Quote[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Quote>(
    `SELECT q.id, q.text, q.author, q.role, q.primary_category
     FROM quotes q
     INNER JOIN saved_quotes sq ON q.id = sq.quote_id
     ORDER BY sq.saved_at DESC`,
  );
  for (const row of rows) {
    row.categories = await getQuoteCategories(row.id);
  }
  return rows;
}

/**
 * Upsert quotes and their category associations.
 * Inserts new quotes, updates existing ones. Never deletes.
 */
export async function syncQuotes(
  quotes: Omit<Quote, "categories">[],
  categoryMap: Record<number, string[]>,
): Promise<void> {
  const db = await getDatabase();
  const BATCH_SIZE = 50;

  for (let i = 0; i < quotes.length; i += BATCH_SIZE) {
    const batch = quotes.slice(i, i + BATCH_SIZE);
    const placeholders = batch.map(() => "(?, ?, ?, ?, ?)").join(", ");
    const values = batch.flatMap((q) => [
      q.id,
      q.text,
      q.author,
      q.role,
      q.primary_category,
    ]);

    await db.runAsync(
      `INSERT INTO quotes (id, text, author, role, primary_category)
       VALUES ${placeholders}
       ON CONFLICT(id) DO UPDATE SET
         text = excluded.text,
         author = excluded.author,
         role = excluded.role,
         primary_category = excluded.primary_category`,
      values,
    );

    // Sync categories for each quote
    for (const q of batch) {
      const cats = categoryMap[q.id] ?? [q.primary_category];
      // Delete old associations and re-insert
      await db.runAsync("DELETE FROM quote_categories WHERE quote_id = ?", [
        q.id,
      ]);
      for (const cat of cats) {
        await db.runAsync(
          "INSERT OR IGNORE INTO quote_categories (quote_id, category) VALUES (?, ?)",
          [q.id, cat],
        );
      }
    }
  }
}
