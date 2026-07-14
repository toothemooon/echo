import { syncQuotes, Quote } from "./quotes";

const quotesData: {
  id: number;
  text: string;
  author: string;
  role: string;
  primary_category: string;
  categories: string[];
}[] = require("../../assets/quotes.json");

/**
 * Sync quotes from JSON into SQLite on every launch.
 * - New quotes are inserted
 * - Existing quotes are updated (text, author, role, primary_category)
 * - Category associations are re-synced
 * - Never deletes old quotes
 */
export async function syncDatabase(): Promise<void> {
  const quotes: Omit<Quote, "categories">[] = quotesData.map((q) => ({
    id: q.id,
    text: q.text,
    author: q.author,
    role: q.role,
    primary_category: q.primary_category,
  }));

  const categoryMap: Record<number, string[]> = {};
  for (const q of quotesData) {
    categoryMap[q.id] = q.categories;
  }

  await syncQuotes(quotes, categoryMap);
  console.log(`Synced ${quotes.length} quotes to database.`);
}
