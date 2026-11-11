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
import {
  normalizeExposureCounts,
  quoteKey,
  recordExposure,
  type ExposureCounts,
} from "../recommendation/exposure";
import { getViewedQuotes } from "./viewedQuotes";
import { enqueueStorageMutation } from "./storageMutationQueue";

export const RECOMMENDATION_STATE_KEY = "@echo/recommendation_state_v2";
const LEGACY_ROTATION_KEY = "@echo/quote_rotation_v1";
const LEGACY_EXPOSURE_KEY_PREFIX = "@echo/quote_exposure_v1:";
const LANGUAGES: readonly QuoteLanguage[] = ["en", "zh-Hans", "ja"];
const RECENT_SELECTION_LIMIT = 32;

export type RecommendationStorage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  getAllKeys(): Promise<readonly string[]>;
  multiRemove(keys: readonly string[]): Promise<void>;
};

export type RecommendationStateV2 = {
  schemaVersion: 2;
  epoch: number;
  rotation: RotationState;
  exposures: Record<QuoteLanguage, ExposureCounts>;
};

export type PreparedQuoteSelection = {
  selectionId: string;
  quote: Quote;
  generation: number;
  epoch: number;
};

export type CommitQuoteSelectionResult = "committed" | "duplicate" | "stale";

type RecentCommitCache = { epoch: number; selectionIds: string[] };

export class InvalidRecommendationStateError extends Error {
  constructor() {
    super("Stored recommendation state is invalid.");
    this.name = "InvalidRecommendationStateError";
  }
}

const migrationFlights = new WeakMap<
  RecommendationStorage,
  Promise<RecommendationStateV2>
>();
const recentCommits = new WeakMap<RecommendationStorage, RecentCommitCache>();

function localDate(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function emptyRotation(): RotationState {
  return {
    date: localDate(),
    shownQuoteIds: [],
    shownAuthorIds: [],
    categoryCounts: {},
    subcategoryCounts: {},
    languageCounts: {},
  };
}

function emptyExposures(): Record<QuoteLanguage, ExposureCounts> {
  return { en: {}, "zh-Hans": {}, ja: {} };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidCountRecord(value: unknown): value is Record<string, number> {
  return (
    isObject(value) &&
    Object.values(value).every(
      (count) => typeof count === "number" && Number.isFinite(count) && count >= 0,
    )
  );
}

function normalizeRotation(value: unknown): RotationState {
  if (!isObject(value)) throw new InvalidRecommendationStateError();
  if (
    typeof value.date !== "string" ||
    !Array.isArray(value.shownQuoteIds) ||
    !Array.isArray(value.shownAuthorIds) ||
    !isValidCountRecord(value.categoryCounts) ||
    !isValidCountRecord(value.subcategoryCounts) ||
    !isValidCountRecord(value.languageCounts)
  ) {
    throw new InvalidRecommendationStateError();
  }

  const rotation = {
    date: value.date,
    shownQuoteIds: value.shownQuoteIds.filter(
      (id): id is Quote["id"] =>
        typeof id === "string" || (typeof id === "number" && Number.isFinite(id)),
    ),
    shownAuthorIds: value.shownAuthorIds.filter(
      (id): id is string => typeof id === "string",
    ),
    categoryCounts: value.categoryCounts as RotationState["categoryCounts"],
    subcategoryCounts: value.subcategoryCounts,
    languageCounts: value.languageCounts as RotationState["languageCounts"],
  };
  return rotation.date === localDate() ? rotation : emptyRotation();
}

function parseSnapshot(raw: string): RecommendationStateV2 {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new InvalidRecommendationStateError();
  }
  if (
    !isObject(value) ||
    value.schemaVersion !== 2 ||
    !Number.isInteger(value.epoch) ||
    (value.epoch as number) < 0 ||
    !isObject(value.exposures)
  ) {
    throw new InvalidRecommendationStateError();
  }

  const exposures = emptyExposures();
  for (const language of LANGUAGES) {
    if (!(language in value.exposures) || !isObject(value.exposures[language])) {
      throw new InvalidRecommendationStateError();
    }
    exposures[language] = normalizeExposureCounts(value.exposures[language]);
  }

  return {
    schemaVersion: 2,
    epoch: value.epoch as number,
    rotation: normalizeRotation(value.rotation),
    exposures,
  };
}

function parseLegacyRotation(raw: string | null): RotationState {
  if (!raw) return emptyRotation();
  try {
    const value: unknown = JSON.parse(raw);
    if (!isObject(value) || typeof value.date !== "string") return emptyRotation();
    if (value.date !== localDate()) return emptyRotation();
    return normalizeRotation({
      date: value.date,
      shownQuoteIds: Array.isArray(value.shownQuoteIds) ? value.shownQuoteIds : [],
      shownAuthorIds: Array.isArray(value.shownAuthorIds) ? value.shownAuthorIds : [],
      categoryCounts: isValidCountRecord(value.categoryCounts) ? value.categoryCounts : {},
      subcategoryCounts: isValidCountRecord(value.subcategoryCounts) ? value.subcategoryCounts : {},
      languageCounts: isValidCountRecord(value.languageCounts) ? value.languageCounts : {},
    });
  } catch {
    return emptyRotation();
  }
}

function legacyExposureKey(language: QuoteLanguage): string {
  return `${LEGACY_EXPOSURE_KEY_PREFIX}${language}`;
}

async function removeLegacyKeys(storage: RecommendationStorage): Promise<void> {
  const keys = await storage.getAllKeys();
  const legacyKeys = keys.filter(
    (key) => key === LEGACY_ROTATION_KEY || key.startsWith(LEGACY_EXPOSURE_KEY_PREFIX),
  );
  if (legacyKeys.length) await storage.multiRemove(legacyKeys);
}

async function readLegacyState(
  storage: RecommendationStorage,
): Promise<RecommendationStateV2> {
  const [rawRotation, ...rawExposures] = await Promise.all([
    storage.getItem(LEGACY_ROTATION_KEY),
    ...LANGUAGES.map((language) => storage.getItem(legacyExposureKey(language))),
  ]);
  const exposures = emptyExposures();
  const viewedQuotes = await getViewedQuotes(storage);

  LANGUAGES.forEach((language, index) => {
    const raw = rawExposures[index] ?? null;
    if (raw !== null) {
      try {
        exposures[language] = normalizeExposureCounts(JSON.parse(raw));
      } catch {
        exposures[language] = {};
      }
    } else {
      exposures[language] = Object.fromEntries(
        viewedQuotes
          .filter((record) => record.quote.language === language)
          .map((record) => [quoteKey(record.quote.id), 1]),
      );
    }
  });

  return {
    schemaVersion: 2,
    epoch: 0,
    rotation: parseLegacyRotation(rawRotation),
    exposures,
  };
}

/** Must be called while the shared storage mutation queue is held. */
async function loadOrMigrateInQueue(
  storage: RecommendationStorage,
): Promise<RecommendationStateV2> {
  const existing = await storage.getItem(RECOMMENDATION_STATE_KEY);
  if (existing !== null) {
    const snapshot = parseSnapshot(existing);
    try {
      await removeLegacyKeys(storage);
    } catch {
      // Keep v2 authoritative and retry legacy cleanup on a later read.
    }
    return snapshot;
  }

  const migrated = await readLegacyState(storage);
  await storage.setItem(RECOMMENDATION_STATE_KEY, JSON.stringify(migrated));
  try {
    await removeLegacyKeys(storage);
  } catch {
    // The migration is committed. Residual v1 keys are cleaned on a later read.
  }
  return migrated;
}

async function ensureRecommendationSnapshot(
  storage: RecommendationStorage,
): Promise<RecommendationStateV2> {
  const active = migrationFlights.get(storage);
  if (active) return active;

  const flight = enqueueStorageMutation(() => loadOrMigrateInQueue(storage));
  migrationFlights.set(storage, flight);
  try {
    return await flight;
  } finally {
    if (migrationFlights.get(storage) === flight) migrationFlights.delete(storage);
  }
}

function totalExposureCount(state: RecommendationStateV2): number {
  return LANGUAGES.reduce(
    (total, language) =>
      total + Object.values(state.exposures[language]).reduce((sum, count) => sum + count, 0),
    0,
  );
}

function rememberCommit(
  storage: RecommendationStorage,
  epoch: number,
  selectionId: string,
): void {
  let cache = recentCommits.get(storage);
  if (!cache || cache.epoch !== epoch) {
    cache = { epoch, selectionIds: [] };
    recentCommits.set(storage, cache);
  }
  cache.selectionIds = [...cache.selectionIds, selectionId].slice(-RECENT_SELECTION_LIMIT);
}

export async function prepareNextRecommendedQuote(
  preferredCategories: Category[],
  recentQuotes: Quote[],
  language: QuoteLanguage,
  generation: number,
  storage: RecommendationStorage = AsyncStorage,
): Promise<PreparedQuoteSelection | null> {
  let state: RecommendationStateV2;
  try {
    state = await ensureRecommendationSnapshot(storage);
  } catch (error) {
    // A failed first migration leaves old keys intact and still permits reading.
    // A malformed v2 snapshot is authoritative and must surface as an error.
    if (error instanceof InvalidRecommendationStateError) throw error;
    if ((await storage.getItem(RECOMMENDATION_STATE_KEY)) !== null) throw error;
    state = await readLegacyState(storage);
  }

  const rotationIndex = totalExposureCount(state);
  const quote = selectNextQuote(BUILT_IN_QUOTES, {
    preferredCategories,
    recentQuotes,
    rotation: state.rotation,
    exposure: state.exposures[language],
    language,
  });
  if (!quote) return null;

  return {
    selectionId: JSON.stringify([state.epoch, generation, rotationIndex, quote.id]),
    quote,
    generation,
    epoch: state.epoch,
  };
}

export function commitQuoteSelection(
  selection: PreparedQuoteSelection,
  storage: RecommendationStorage = AsyncStorage,
): Promise<CommitQuoteSelectionResult> {
  return ensureRecommendationSnapshot(storage).then(() =>
    enqueueStorageMutation(async () => {
      const state = await loadOrMigrateInQueue(storage);
      let cache = recentCommits.get(storage);
      if (!cache || cache.epoch !== state.epoch) {
        cache = { epoch: state.epoch, selectionIds: [] };
        recentCommits.set(storage, cache);
      }
      if (selection.epoch !== state.epoch) return "stale";
      if (cache.selectionIds.includes(selection.selectionId)) return "duplicate";

      const next: RecommendationStateV2 = {
        schemaVersion: 2,
        epoch: state.epoch,
        rotation: recordSelection(state.rotation, selection.quote),
        exposures: {
          ...state.exposures,
          [selection.quote.language]: recordExposure(
            state.exposures[selection.quote.language],
            selection.quote,
          ),
        },
      };
      await storage.setItem(RECOMMENDATION_STATE_KEY, JSON.stringify(next));
      rememberCommit(storage, state.epoch, selection.selectionId);
      return "committed";
    }),
  );
}

/** Writes the Clear All marker while the caller holds the shared queue. */
export async function clearRecommendationStateInQueue(
  storage: RecommendationStorage,
): Promise<void> {
  const raw = await storage.getItem(RECOMMENDATION_STATE_KEY);
  let epoch = 0;
  if (raw !== null) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (
        isObject(parsed) &&
        parsed.schemaVersion === 2 &&
        Number.isInteger(parsed.epoch) &&
        (parsed.epoch as number) >= 0
      ) {
        epoch = parsed.epoch as number;
      }
    } catch {
      // Clear All repairs an unreadable v2 snapshot with a new empty epoch.
    }
  }
  const nextEpoch = epoch + 1;
  await storage.setItem(
    RECOMMENDATION_STATE_KEY,
    JSON.stringify({
      schemaVersion: 2,
      epoch: nextEpoch,
      rotation: emptyRotation(),
      exposures: emptyExposures(),
    } satisfies RecommendationStateV2),
  );
  recentCommits.set(storage, { epoch: nextEpoch, selectionIds: [] });
}
