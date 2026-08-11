import AsyncStorage from "@react-native-async-storage/async-storage";
import type { QuoteLanguage } from "../data/quotes";
import {
  normalizeExposureCounts,
  seedExposureFromViewed,
  type ExposureCounts,
} from "../recommendation/exposure";
import { getViewedQuotes } from "./viewedQuotes";

const EXPOSURE_KEY_PREFIX = "@echo/quote_exposure_v1:";

function exposureKey(language: QuoteLanguage): string {
  return `${EXPOSURE_KEY_PREFIX}${language}`;
}

/**
 * Reads the read-counts for one language. On the first read after upgrading,
 * seeds from the viewed-quotes log so an existing reader is not handed back
 * the hundred quotes they just finished.
 */
export async function getExposure(
  language: QuoteLanguage,
): Promise<ExposureCounts> {
  try {
    const raw = await AsyncStorage.getItem(exposureKey(language));
    if (raw) return normalizeExposureCounts(JSON.parse(raw));
  } catch {
    return {};
  }

  try {
    const viewed = await getViewedQuotes();
    return seedExposureFromViewed(
      {},
      viewed
        .map((record) => record.quote)
        .filter((quote) => quote.language === language),
    );
  } catch {
    return {};
  }
}

export async function saveExposure(
  language: QuoteLanguage,
  counts: ExposureCounts,
): Promise<void> {
  await AsyncStorage.setItem(exposureKey(language), JSON.stringify(counts));
}
