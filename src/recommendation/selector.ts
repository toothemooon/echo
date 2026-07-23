import { CATEGORIES, type Category } from "../constants/categories";
import type { Quote, QuoteId, QuoteLanguage } from "../data/quotes";

export type RotationState = {
  date: string;
  shownQuoteIds: QuoteId[];
  shownAuthorIds: string[];
  categoryCounts: Partial<Record<Category, number>>;
  subcategoryCounts: Record<string, number>;
  languageCounts: Partial<Record<Quote["language"], number>>;
};

export type SelectionOptions = {
  preferredCategories: Category[];
  recentQuotes: Quote[];
  rotation: RotationState;
  language?: QuoteLanguage;
  random?: () => number;
};

function countForCategory(
  state: RotationState,
  category: Category,
): number {
  return state.categoryCounts[category] ?? 0;
}

function chooseFromPool(
  pool: readonly Quote[],
  options: SelectionOptions,
): Quote | null {
  if (pool.length === 0) return null;

  const preferred = options.preferredCategories.length
    ? options.preferredCategories
    : CATEGORIES;
  const categoryOrder = [...preferred].sort(
    (left, right) =>
      countForCategory(options.rotation, left) -
        countForCategory(options.rotation, right) ||
      CATEGORIES.indexOf(left) - CATEGORIES.indexOf(right),
  );

  for (const category of categoryOrder) {
    const categoryPool = pool.filter(
      (quote) => quote.primary_category === category,
    );
    if (categoryPool.length === 0) continue;

    const lowestSubcategoryCount = Math.min(
      ...categoryPool.map(
        (quote) =>
          options.rotation.subcategoryCounts[
            `${quote.primary_category}/${quote.subcategory}`
          ] ?? 0,
      ),
    );
    const balancedPool = categoryPool.filter(
      (quote) =>
        (options.rotation.subcategoryCounts[
          `${quote.primary_category}/${quote.subcategory}`
        ] ?? 0) === lowestSubcategoryCount,
    );
    const lowestLanguageCount = Math.min(
      ...balancedPool.map(
        (quote) => options.rotation.languageCounts[quote.language] ?? 0,
      ),
    );
    const languageBalancedPool = balancedPool.filter(
      (quote) =>
        (options.rotation.languageCounts[quote.language] ?? 0) ===
        lowestLanguageCount,
    );
    const random = options.random ?? Math.random;
    return (
      languageBalancedPool[
        Math.floor(random() * languageBalancedPool.length)
      ] ?? null
    );
  }

  return null;
}

export function selectNextQuote(
  quotes: readonly Quote[],
  options: SelectionOptions,
): Quote | null {
  const preferred = new Set(
    options.preferredCategories.length
      ? options.preferredCategories
      : CATEGORIES,
  );
  const recentQuoteIds = new Set(options.recentQuotes.map((quote) => quote.id));
  const recentAuthorIds = new Set(
    options.recentQuotes.slice(-5).map((quote) => quote.author_id),
  );
  const dailyQuoteIds = new Set(options.rotation.shownQuoteIds);
  const dailyAuthorIds = new Set(options.rotation.shownAuthorIds);
  const preferredPool = quotes.filter(
    (quote) =>
      preferred.has(quote.primary_category) &&
      (!options.language || quote.language === options.language),
  );

  const strictPool = preferredPool.filter(
    (quote) =>
      !recentQuoteIds.has(quote.id) &&
      !dailyQuoteIds.has(quote.id) &&
      !recentAuthorIds.has(quote.author_id) &&
      !dailyAuthorIds.has(quote.author_id),
  );
  const strictChoice = chooseFromPool(strictPool, options);
  if (strictChoice) return strictChoice;

  // A narrow preference can exhaust all authors in one day. Relax the
  // day-wide author rule, while still protecting the last five authors and
  // every quote already shown in the current session/day.
  const relaxedDailyAuthors = preferredPool.filter(
    (quote) =>
      !recentQuoteIds.has(quote.id) &&
      !dailyQuoteIds.has(quote.id) &&
      !recentAuthorIds.has(quote.author_id),
  );
  const relaxedChoice = chooseFromPool(relaxedDailyAuthors, options);
  if (relaxedChoice) return relaxedChoice;

  // Final fallback keeps immediate quote and author repetition out, even
  // after a very long session.
  return chooseFromPool(
    preferredPool.filter(
      (quote) =>
        !recentQuoteIds.has(quote.id) &&
        !recentAuthorIds.has(quote.author_id),
    ),
    options,
  );
}

export function recordSelection(
  state: RotationState,
  quote: Quote,
): RotationState {
  const subcategoryKey = `${quote.primary_category}/${quote.subcategory}`;
  return {
    ...state,
    shownQuoteIds: [...new Set([...state.shownQuoteIds, quote.id])],
    shownAuthorIds: [...new Set([...state.shownAuthorIds, quote.author_id])],
    categoryCounts: {
      ...state.categoryCounts,
      [quote.primary_category]:
        (state.categoryCounts[quote.primary_category] ?? 0) + 1,
    },
    subcategoryCounts: {
      ...state.subcategoryCounts,
      [subcategoryKey]: (state.subcategoryCounts[subcategoryKey] ?? 0) + 1,
    },
    languageCounts: {
      ...state.languageCounts,
      [quote.language]: (state.languageCounts[quote.language] ?? 0) + 1,
    },
  };
}
