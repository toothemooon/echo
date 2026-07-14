import { hasQuotes, insertQuotes } from "./quotes";

const quotesData: {
  text: string;
  author: string;
  category: string;
}[] = require("../../assets/quotes.json");

/**
 * Seed the database with initial quotes if empty.
 * Reads from assets/quotes.json and bulk inserts.
 */
export async function seedDatabase(): Promise<void> {
  const exists = await hasQuotes();
  if (exists) return;

  const quotes = quotesData.map((q) => ({
    text: q.text,
    author: q.author,
    category: q.category,
  }));

  await insertQuotes(quotes);
  console.log(`Seeded ${quotes.length} quotes into database.`);
}
