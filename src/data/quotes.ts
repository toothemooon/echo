import quotesJson from "../../assets/quotes.json";
import chineseQuotesJson from "../../assets/quotes.zh-Hans.json";
import japaneseQuotesJson from "../../assets/quotes.ja.json";
import {
  CATEGORIES,
  SUBCATEGORIES,
  type Category,
  type Subcategory,
} from "../constants/categories";

export type QuoteId = number | string;
export type QuoteLanguage = "en" | "zh-Hans" | "ja";

export type Quote = {
  id: QuoteId;
  text: string;
  language: QuoteLanguage;
  author_id: string;
  author: string;
  role: string;
  source?: string;
  primary_category: Category;
  subcategory: Subcategory;
  categories: Category[];
};

const CATEGORY_SET = new Set<Category>(CATEGORIES);

function warnInDevelopment(message: string): void {
  if (typeof __DEV__ !== "undefined" && __DEV__) {
    console.warn(`[quotes] ${message}`);
  }
}

function isCategory(value: unknown): value is Category {
  return typeof value === "string" && CATEGORY_SET.has(value as Category);
}

function isQuoteId(value: unknown): value is QuoteId {
  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  return typeof value === "number" && Number.isFinite(value);
}

function isQuoteLanguage(value: unknown): value is QuoteLanguage {
  return value === "en" || value === "zh-Hans" || value === "ja";
}

function isSubcategory(
  value: unknown,
  category: Category,
): value is Subcategory {
  return (
    typeof value === "string" &&
    (SUBCATEGORIES[category] as readonly string[]).includes(value)
  );
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function isQuote(value: unknown): value is Quote {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  const primaryCategory = candidate.primary_category;
  const categories = candidate.categories;
  const source = candidate.source;

  if (!isCategory(primaryCategory) || !Array.isArray(categories)) {
    return false;
  }

  return (
    isQuoteId(candidate.id) &&
    isNonEmptyString(candidate.text) &&
    isQuoteLanguage(candidate.language) &&
    isNonEmptyString(candidate.author_id) &&
    isNonEmptyString(candidate.author) &&
    isNonEmptyString(candidate.role) &&
    (source === undefined || isNonEmptyString(source)) &&
    isSubcategory(candidate.subcategory, primaryCategory) &&
    categories.length === 1 &&
    categories[0] === primaryCategory
  );
}

function freezeQuote(quote: Quote): Quote {
  const categories = Object.freeze([...quote.categories]) as Category[];
  return Object.freeze({ ...quote, categories }) as Quote;
}

function validateQuoteCollection(value: unknown): Quote[] {
  if (!Array.isArray(value)) {
    warnInDevelopment("The bundled quotes file must contain an array.");
    return [];
  }

  const quotes: Quote[] = [];
  const seenIds = new Set<QuoteId>();
  let invalidCount = 0;
  let duplicateCount = 0;

  value.forEach((candidate) => {
    if (!isQuote(candidate)) {
      invalidCount += 1;
      return;
    }

    if (seenIds.has(candidate.id)) {
      duplicateCount += 1;
      return;
    }

    seenIds.add(candidate.id);
    quotes.push(
      freezeQuote({
        id: candidate.id,
        text: candidate.text,
        language: candidate.language,
        author_id: candidate.author_id,
        author: candidate.author,
        role: candidate.role,
        ...(candidate.source ? { source: candidate.source } : {}),
        primary_category: candidate.primary_category,
        subcategory: candidate.subcategory,
        categories: [...candidate.categories],
      }),
    );
  });

  if (invalidCount > 0) {
    warnInDevelopment(
      `Ignored ${invalidCount} invalid bundled quote record(s).`,
    );
  }

  if (duplicateCount > 0) {
    warnInDevelopment(
      `Ignored ${duplicateCount} bundled quote record(s) with duplicate IDs.`,
    );
  }

  return quotes;
}

/** Validated, runtime-frozen quotes bundled with the app. */
export const BUILT_IN_QUOTES: readonly Quote[] = Object.freeze(
  validateQuoteCollection([
    ...quotesJson,
    ...chineseQuotesJson,
    ...japaneseQuotesJson,
  ]),
);

const QUOTES_BY_ID = new Map<QuoteId, Quote>(
  BUILT_IN_QUOTES.map((quote) => [quote.id, quote]),
);

export function getAllQuotes(): Quote[] {
  return [...BUILT_IN_QUOTES];
}

export function getQuoteById(id: QuoteId): Quote | undefined {
  return QUOTES_BY_ID.get(id);
}

export function getQuotesByCategories(categories: Category[]): Quote[] {
  const validCategories = new Set(categories.filter(isCategory));

  if (validCategories.size === 0) {
    return getAllQuotes();
  }

  const matches = BUILT_IN_QUOTES.filter((quote) =>
    validCategories.has(quote.primary_category),
  );

  return matches.length > 0 ? [...matches] : getAllQuotes();
}

export function getRandomQuote(
  categories: Category[] = [],
  excludedIds: QuoteId[] = [],
): Quote | null {
  const matches = getQuotesByCategories(categories);

  if (matches.length === 0) {
    return null;
  }

  const excludedIdSet = new Set(excludedIds);
  const eligibleMatches = matches.filter(
    (quote) => !excludedIdSet.has(quote.id),
  );
  const candidates = eligibleMatches.length > 0 ? eligibleMatches : matches;
  const randomIndex = Math.floor(Math.random() * candidates.length);

  return candidates[randomIndex] ?? null;
}
