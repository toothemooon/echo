import AsyncStorage from "@react-native-async-storage/async-storage";
import { isQuote, type Quote } from "../data/quotes";
import { quoteKey } from "../recommendation/exposure";

const VIEWED_QUOTES_KEY = "@echo/viewed_quotes_v1";
const MAX_VIEWED_QUOTES = 100;

export type ViewedQuoteRecord = {
  quote: Quote;
  viewedAt: string;
};

let mutationQueue: Promise<void> = Promise.resolve();

function isIsoTimestamp(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString() === value;
}

function isViewedQuoteRecord(value: unknown): value is ViewedQuoteRecord {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return isQuote(candidate.quote) && isIsoTimestamp(candidate.viewedAt);
}

function cloneQuote(quote: Quote): Quote {
  return { ...quote, categories: [...quote.categories] };
}

async function readRecords(): Promise<ViewedQuoteRecord[]> {
  const raw = await AsyncStorage.getItem(VIEWED_QUOTES_KEY);
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const seen = new Set<string>();
    return parsed
      .filter(isViewedQuoteRecord)
      .sort((left, right) => Date.parse(right.viewedAt) - Date.parse(left.viewedAt))
      .filter((record) => {
        const key = quoteKey(record.quote.id);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, MAX_VIEWED_QUOTES);
  } catch {
    return [];
  }
}

export async function getViewedQuotes(): Promise<ViewedQuoteRecord[]> {
  try {
    return await readRecords();
  } catch {
    return [];
  }
}

export async function recordViewedQuote(quote: Quote): Promise<void> {
  const result = mutationQueue.catch(() => undefined).then(async () => {
    const records = await readRecords();
    const key = quoteKey(quote.id);
    const next: ViewedQuoteRecord[] = [
      { quote: cloneQuote(quote), viewedAt: new Date().toISOString() },
      ...records.filter((record) => quoteKey(record.quote.id) !== key),
    ].slice(0, MAX_VIEWED_QUOTES);
    await AsyncStorage.setItem(VIEWED_QUOTES_KEY, JSON.stringify(next));
  });

  mutationQueue = result.catch(() => undefined);
  await result;
}

export async function clearViewedQuotes(): Promise<void> {
  const result = mutationQueue.catch(() => undefined).then(() =>
    AsyncStorage.removeItem(VIEWED_QUOTES_KEY),
  );
  mutationQueue = result.catch(() => undefined);
  await result;
}
