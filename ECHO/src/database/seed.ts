import { syncQuotes } from "./quotes";

const quotesData: {
  id: number;
  text: string;
  author: string;
  category: string;
}[] = require("../../assets/quotes.json");

/**
 * Sync quotes from JSON into SQLite on every launch.
 * - New quotes are inserted
 * - Existing quotes are updated (text, author, category)
 * - Old quotes in DB are preserved (never deleted)
 * - Saved quotes / history are untouched
 */
export async function syncDatabase(): Promise<void> {
  const quotes = quotesData.map((q) => ({
    id: q.id,
    text: q.text,
    author: q.author,
    category: q.category,
  }));

  await syncQuotes(quotes);
  console.log(`Synced ${quotes.length} quotes to database.`);
}
