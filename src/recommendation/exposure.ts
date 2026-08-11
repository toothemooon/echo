import { getQuoteById, type Quote, type QuoteId } from "../data/quotes";

/**
 * How many full sweeps of the catalog each quote has been shown in, keyed by
 * `quoteKey`. The selector serves the lowest count first, so a pool is read
 * end to end before any quote comes back around.
 */
export type ExposureCounts = Readonly<Record<string, number>>;

/**
 * Quote IDs are mixed types across the bundled catalogs — the English file
 * uses numbers and strings, the others only strings — so the type has to be
 * part of the key or `1` and `"1"` collide.
 */
export function quoteKey(id: QuoteId): string {
  return `${typeof id}:${String(id)}`;
}

export function exposureOf(counts: ExposureCounts, quote: Quote): number {
  return counts[quoteKey(quote.id)] ?? 0;
}

export function recordExposure(
  counts: ExposureCounts,
  quote: Quote,
): ExposureCounts {
  const key = quoteKey(quote.id);
  return { ...counts, [key]: (counts[key] ?? 0) + 1 };
}

/**
 * Accepts whatever came back from storage and keeps only usable entries.
 * Dropping keys that are no longer in the catalog bounds growth across
 * catalog revisions.
 */
export function normalizeExposureCounts(raw: unknown): ExposureCounts {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return {};
  }

  const counts: Record<string, number> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value !== "number") continue;
    if (!Number.isInteger(value) || value <= 0) continue;
    if (!isKnownQuoteKey(key)) continue;
    counts[key] = value;
  }

  return counts;
}

function isKnownQuoteKey(key: string): boolean {
  const separatorIndex = key.indexOf(":");
  if (separatorIndex < 0) return false;

  const type = key.slice(0, separatorIndex);
  const raw = key.slice(separatorIndex + 1);

  if (type === "string") return getQuoteById(raw) !== undefined;
  if (type !== "number") return false;

  const id = Number(raw);
  return Number.isFinite(id) && getQuoteById(id) !== undefined;
}

/**
 * Upgrade path: an existing install already has up to 100 viewed quotes on
 * disk, so seed those as read rather than letting the first sweep serve them
 * all over again. Never lowers a count that is already recorded.
 */
export function seedExposureFromViewed(
  counts: ExposureCounts,
  quotes: readonly Quote[],
): ExposureCounts {
  const seeded: Record<string, number> = { ...counts };
  for (const quote of quotes) {
    const key = quoteKey(quote.id);
    seeded[key] = Math.max(seeded[key] ?? 0, 1);
  }
  return seeded;
}
