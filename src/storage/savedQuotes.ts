import AsyncStorage from "@react-native-async-storage/async-storage";
import { isQuote, Quote, QuoteId } from "../data/quotes";

const SAVED_QUOTES_KEY = "@echo/saved_quotes";

export type SavedQuoteRecord = {
  quote: Quote;
  savedAt: string;
};

let mutationQueue: Promise<void> = Promise.resolve();

function warnInDevelopment(operation: string, error?: unknown): void {
  if (typeof __DEV__ === "undefined" || !__DEV__) return;

  const errorKind = error instanceof Error ? error.name : "InvalidData";
  console.warn(`[storage/savedQuotes] ${operation} (${errorKind}).`);
}

function isQuoteId(value: unknown): value is QuoteId {
  return (
    (typeof value === "number" && Number.isFinite(value)) ||
    (typeof value === "string" && value.trim().length > 0)
  );
}

function isIsoTimestamp(value: unknown): value is string {
  if (typeof value !== "string") return false;

  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return false;

  try {
    return new Date(timestamp).toISOString() === value;
  } catch {
    return false;
  }
}

function isSavedQuoteRecord(value: unknown): value is SavedQuoteRecord {
  if (typeof value !== "object" || value === null) return false;

  const candidate = value as Record<string, unknown>;
  return isQuote(candidate.quote) && isIsoTimestamp(candidate.savedAt);
}

function quoteIdKey(id: QuoteId): string {
  return `${typeof id}:${String(id)}`;
}

function sortAndDeduplicate(
  records: SavedQuoteRecord[],
): SavedQuoteRecord[] {
  const sorted = [...records].sort(
    (left, right) => Date.parse(right.savedAt) - Date.parse(left.savedAt),
  );
  const seenIds = new Set<string>();

  return sorted.filter((record) => {
    const key = quoteIdKey(record.quote.id);
    if (seenIds.has(key)) return false;

    seenIds.add(key);
    return true;
  });
}

function cloneQuote(quote: Quote): Quote {
  return {
    ...quote,
    categories: [...quote.categories],
  };
}

async function readStoredRecords(): Promise<SavedQuoteRecord[]> {
  const storedValue = await AsyncStorage.getItem(SAVED_QUOTES_KEY);
  if (storedValue === null) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(storedValue);
  } catch (error) {
    warnInDevelopment("Discarded malformed saved-quotes JSON", error);
    return [];
  }

  if (!Array.isArray(parsed)) {
    warnInDevelopment("Discarded invalid saved-quotes collection");
    return [];
  }

  const validRecords = parsed.filter(isSavedQuoteRecord);
  if (validRecords.length !== parsed.length) {
    warnInDevelopment("Discarded invalid saved-quote records");
  }

  return sortAndDeduplicate(validRecords);
}

async function writeStoredRecords(
  records: SavedQuoteRecord[],
): Promise<void> {
  if (!Array.isArray(records) || !records.every(isSavedQuoteRecord)) {
    throw new TypeError("Saved quotes must contain valid snapshot records.");
  }

  const normalized = sortAndDeduplicate(records);
  if (!normalized.every(isSavedQuoteRecord)) {
    throw new TypeError("Saved quotes failed validation before writing.");
  }

  await AsyncStorage.setItem(SAVED_QUOTES_KEY, JSON.stringify(normalized));
}

function enqueueMutation(
  operation: string,
  task: () => Promise<void>,
): Promise<void> {
  const result = mutationQueue.then(async () => {
    try {
      await task();
    } catch (error) {
      warnInDevelopment(operation, error);
      throw error;
    }
  });

  mutationQueue = result.catch(() => undefined);
  return result;
}

/** Returns valid saved snapshots ordered from newest to oldest. */
export async function getSavedQuotes(): Promise<SavedQuoteRecord[]> {
  await mutationQueue;

  try {
    return await readStoredRecords();
  } catch (error) {
    warnInDevelopment("Failed to read saved quotes", error);
    return [];
  }
}

/** Saves a complete quote snapshot without creating duplicate IDs. */
export async function saveQuote(quote: Quote): Promise<void> {
  if (!isQuote(quote)) {
    const error = new TypeError("Cannot save an invalid quote snapshot.");
    warnInDevelopment("Rejected invalid quote snapshot", error);
    throw error;
  }

  const snapshot = cloneQuote(quote);

  return enqueueMutation("Failed to save quote", async () => {
    const records = await readStoredRecords();
    const key = quoteIdKey(snapshot.id);

    if (records.some((record) => quoteIdKey(record.quote.id) === key)) {
      return;
    }

    await writeStoredRecords([
      { quote: snapshot, savedAt: new Date().toISOString() },
      ...records,
    ]);
  });
}

/** Removes only the snapshot whose ID exactly matches the requested ID. */
export async function removeSavedQuote(quoteId: QuoteId): Promise<void> {
  if (!isQuoteId(quoteId)) {
    const error = new TypeError("Cannot remove a quote with an invalid ID.");
    warnInDevelopment("Rejected invalid quote ID", error);
    throw error;
  }

  return enqueueMutation("Failed to remove saved quote", async () => {
    const records = await readStoredRecords();
    const key = quoteIdKey(quoteId);
    const remaining = records.filter(
      (record) => quoteIdKey(record.quote.id) !== key,
    );

    if (remaining.length === records.length) return;
    await writeStoredRecords(remaining);
  });
}

/** Checks the persisted snapshots without consulting the current JSON source. */
export async function isQuoteSaved(quoteId: QuoteId): Promise<boolean> {
  if (!isQuoteId(quoteId)) return false;

  const records = await getSavedQuotes();
  const key = quoteIdKey(quoteId);
  return records.some((record) => quoteIdKey(record.quote.id) === key);
}

/** Adds or removes a complete quote snapshot in one serialized mutation. */
export async function toggleSavedQuote(quote: Quote): Promise<void> {
  if (!isQuote(quote)) {
    const error = new TypeError("Cannot toggle an invalid quote snapshot.");
    warnInDevelopment("Rejected invalid quote snapshot", error);
    throw error;
  }

  const snapshot = cloneQuote(quote);

  return enqueueMutation("Failed to toggle saved quote", async () => {
    const records = await readStoredRecords();
    const key = quoteIdKey(snapshot.id);
    const existingIndex = records.findIndex(
      (record) => quoteIdKey(record.quote.id) === key,
    );

    if (existingIndex >= 0) {
      await writeStoredRecords(
        records.filter((_, index) => index !== existingIndex),
      );
      return;
    }

    await writeStoredRecords([
      { quote: snapshot, savedAt: new Date().toISOString() },
      ...records,
    ]);
  });
}
