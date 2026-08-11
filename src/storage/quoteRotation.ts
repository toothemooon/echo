import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  BUILT_IN_QUOTES,
  type Quote,
  type QuoteLanguage,
} from "../data/quotes";
import type { Category } from "../constants/categories";
import {
  recordSelection,
  selectNextQuote,
  type RotationState,
} from "../recommendation/selector";
import { recordExposure } from "../recommendation/exposure";
import { getExposure, saveExposure } from "./quoteExposure";

const ROTATION_KEY = "@echo/quote_rotation_v1";

/**
 * Serializes the read-select-write cycle. Rotation and exposure are both
 * read-modify-write, and the UI's `isSelectingQuote` ref only guards the
 * "next" button — it does not cover a mood or language change overlapping a
 * cold-start selection. A dropped write there would re-serve a quote the
 * reader has already seen.
 */
let mutationQueue: Promise<unknown> = Promise.resolve();

function enqueue<T>(operation: () => Promise<T>): Promise<T> {
  const result = mutationQueue.catch(() => undefined).then(operation);
  mutationQueue = result.catch(() => undefined);
  return result;
}

function localDate(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function emptyState(): RotationState {
  return {
    date: localDate(),
    shownQuoteIds: [],
    shownAuthorIds: [],
    categoryCounts: {},
    subcategoryCounts: {},
    languageCounts: {},
  };
}

export async function getRotationState(): Promise<RotationState> {
  try {
    const raw = await AsyncStorage.getItem(ROTATION_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as Partial<RotationState>;
    if (parsed.date !== localDate()) return emptyState();
    return {
      date: parsed.date,
      shownQuoteIds: Array.isArray(parsed.shownQuoteIds)
        ? parsed.shownQuoteIds
        : [],
      shownAuthorIds: Array.isArray(parsed.shownAuthorIds)
        ? parsed.shownAuthorIds.filter(
            (value): value is string => typeof value === "string",
          )
        : [],
      categoryCounts: parsed.categoryCounts ?? {},
      subcategoryCounts: parsed.subcategoryCounts ?? {},
      languageCounts: parsed.languageCounts ?? {},
    };
  } catch {
    return emptyState();
  }
}

export async function getNextRecommendedQuote(
  preferredCategories: Category[],
  recentQuotes: Quote[],
  language: QuoteLanguage,
): Promise<Quote | null> {
  return enqueue(async () => {
    const [rotation, exposure] = await Promise.all([
      getRotationState(),
      getExposure(language),
    ]);
    const quote = selectNextQuote(BUILT_IN_QUOTES, {
      preferredCategories,
      recentQuotes,
      rotation,
      exposure,
      language,
    });
    if (!quote) return null;

    try {
      await Promise.all([
        AsyncStorage.setItem(
          ROTATION_KEY,
          JSON.stringify(recordSelection(rotation, quote)),
        ),
        saveExposure(language, recordExposure(exposure, quote)),
      ]);
    } catch {
      // Recommendation still works in memory when persistence is unavailable.
    }
    return quote;
  });
}
