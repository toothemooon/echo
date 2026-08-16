import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  CATEGORIES,
  MOOD_OPTIONS,
  type Category,
  type MoodPreference,
} from "../constants/categories";
import type { QuoteLanguage } from "../data/quotes";
import { enqueueStorageMutation } from "./storageMutationQueue";

const QUOTE_FONT_KEY = "@echo/quote_font";
const QUOTE_FONT_SIZE_KEY = "@echo/quote_font_size";
const QUOTE_ANIMATION_KEY = "@echo/quote_animation";
const QUOTE_LANGUAGE_KEY = "@echo/quote_language";
const MOOD_KEY = "@echo/mood_preference";
const ONBOARDING_KEY = "@echo/onboarding_complete";
const HIGH_CONTRAST_KEY = "@echo/high_contrast";

export type QuoteFont = "elegant" | "system";
export type QuoteFontSize = "small" | "medium" | "large";
export type ThemeMode = "light" | "dark" | "archive";
export type QuoteAnimation = "fade" | "horizontal" | "none";
export type QuoteLanguagePreference = QuoteLanguage;

const PREFS_KEY = "@echo/preferred_categories";
const THEME_KEY = "@echo/theme";

const VALID_CATEGORIES = new Set<string>(CATEGORIES);
const VALID_MOODS = new Set<string>(MOOD_OPTIONS.map((option) => option.value));

function warnInDevelopment(operation: string, error?: unknown): void {
  if (typeof __DEV__ === "undefined" || !__DEV__) return;

  const errorKind = error instanceof Error ? error.name : "InvalidData";
  console.warn(`[storage/preferences] ${operation} (${errorKind}).`);
}

function normalizeCategories(value: unknown): Category[] {
  if (!Array.isArray(value)) return [];

  const seen = new Set<Category>();
  const categories: Category[] = [];

  for (const item of value) {
    if (
      typeof item === "string" &&
      VALID_CATEGORIES.has(item) &&
      !seen.has(item as Category)
    ) {
      const category = item as Category;
      seen.add(category);
      categories.push(category);
    }
  }

  return categories;
}

function allCategories(): Category[] {
  return [...CATEGORIES];
}

function setStorageItem(key: string, value: string): Promise<void> {
  return enqueueStorageMutation(() => AsyncStorage.setItem(key, value));
}

/**
 * Returns the stored categories, or all categories when storage is empty or
 * contains no valid category values.
 */
export async function getPreferredCategories(): Promise<Category[]> {
  try {
    const storedValue = await AsyncStorage.getItem(PREFS_KEY);
    if (storedValue === null) return allCategories();

    const parsed: unknown = JSON.parse(storedValue);
    const categories = normalizeCategories(parsed);

    if (categories.length === 0) {
      if (!Array.isArray(parsed) || parsed.length > 0) {
        warnInDevelopment("Ignored invalid preferred categories");
      }
      return allCategories();
    }

    if (Array.isArray(parsed) && categories.length !== parsed.length) {
      warnInDevelopment("Ignored invalid or duplicate preferred categories");
    }

    return categories;
  } catch (error) {
    warnInDevelopment("Failed to read preferred categories", error);
    return allCategories();
  }
}

/** Saves a normalized, non-empty list of preferred categories. */
export async function setPreferredCategories(
  categories: Category[],
): Promise<void> {
  try {
    const normalized = normalizeCategories(categories);
    const value = normalized.length > 0 ? normalized : allCategories();
    await setStorageItem(PREFS_KEY, JSON.stringify(value));
  } catch (error) {
    warnInDevelopment("Failed to write preferred categories", error);
    throw error;
  }
}

/** Returns the stored theme, or null when the system theme should be used. */
export async function getTheme(): Promise<ThemeMode | null> {
  try {
    const value = await AsyncStorage.getItem(THEME_KEY);
    if (value === null) return null;
    if (value === "light" || value === "dark" || value === "archive") {
      return value;
    }

    warnInDevelopment("Ignored invalid theme");
    return null;
  } catch (error) {
    warnInDevelopment("Failed to read theme", error);
    return null;
  }
}

/** Saves an explicit theme preference. */
export async function setTheme(theme: ThemeMode): Promise<void> {
  try {
    if (theme !== "light" && theme !== "dark" && theme !== "archive") {
      throw new TypeError("Theme must be light, dark, or archive.");
    }

    await setStorageItem(THEME_KEY, theme);
  } catch (error) {
    warnInDevelopment("Failed to write theme", error);
    throw error;
  }
}

export async function getQuoteFont(): Promise<QuoteFont> {
  try {
    const value = await AsyncStorage.getItem(QUOTE_FONT_KEY);

    if (value === "elegant" || value === "system") {
      return value;
    }

    return "elegant";
  } catch (error) {
    warnInDevelopment("Failed to read quote font", error);
    return "elegant";
  }
}

export async function setQuoteFont(font: QuoteFont): Promise<void> {
  await setStorageItem(QUOTE_FONT_KEY, font);
}

// font
export async function getQuoteFontSize(): Promise<QuoteFontSize> {
  try {
    const value = await AsyncStorage.getItem(QUOTE_FONT_SIZE_KEY);

    if (value === "small" || value === "medium" || value === "large") {
      return value;
    }

    return "medium";
  } catch (error) {
    warnInDevelopment("Failed to read quote font size", error);
    return "medium";
  }
}

export async function setQuoteFontSize(size: QuoteFontSize): Promise<void> {
  await setStorageItem(QUOTE_FONT_SIZE_KEY, size);
}

export async function getQuoteAnimation(): Promise<QuoteAnimation> {
  try {
    const value = await AsyncStorage.getItem(QUOTE_ANIMATION_KEY);

    if (
      value === "fade" ||
      value === "horizontal" ||
      value === "none"
    ) {
      return value;
    }

    return "horizontal";
  } catch (error) {
    warnInDevelopment("Failed to read quote animation", error);
    return "horizontal";
  }
}

export async function setQuoteAnimation(
  animation: QuoteAnimation,
): Promise<void> {
  await setStorageItem(QUOTE_ANIMATION_KEY, animation);
}

export async function getMoodPreference(): Promise<MoodPreference> {
  try {
    const value = await AsyncStorage.getItem(MOOD_KEY);
    return value && VALID_MOODS.has(value)
      ? (value as MoodPreference)
      : "surprise";
  } catch (error) {
    warnInDevelopment("Failed to read mood preference", error);
    return "surprise";
  }
}

export async function setMoodPreference(
  mood: MoodPreference,
): Promise<void> {
  if (!VALID_MOODS.has(mood)) {
    throw new TypeError("Invalid mood preference.");
  }
  await setStorageItem(MOOD_KEY, mood);
}

export async function getOnboardingComplete(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(ONBOARDING_KEY)) === "true";
  } catch (error) {
    warnInDevelopment("Failed to read onboarding state", error);
    return false;
  }
}

export async function setOnboardingComplete(value: boolean): Promise<void> {
  await setStorageItem(ONBOARDING_KEY, String(value));
}

export async function getQuoteLanguage(): Promise<QuoteLanguagePreference> {
  try {
    const value = await AsyncStorage.getItem(QUOTE_LANGUAGE_KEY);

    if (value === "en" || value === "zh-Hans" || value === "ja") {
      return value;
    }

    return "en";
  } catch (error) {
    warnInDevelopment("Failed to read quote language", error);
    return "en";
  }
}

export async function setQuoteLanguage(
  language: QuoteLanguagePreference,
): Promise<void> {
  if (
    language !== "en" &&
    language !== "zh-Hans" &&
    language !== "ja"
  ) {
    throw new TypeError("Invalid quote language.");
  }

  await setStorageItem(QUOTE_LANGUAGE_KEY, language);
}

export async function getHighContrast(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(HIGH_CONTRAST_KEY)) === "true";
  } catch (error) {
    warnInDevelopment("Failed to read high contrast preference", error);
    return false;
  }
}

export async function setHighContrast(value: boolean): Promise<void> {
  await setStorageItem(HIGH_CONTRAST_KEY, String(value));
}
