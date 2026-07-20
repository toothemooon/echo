import AsyncStorage from "@react-native-async-storage/async-storage";
import { CATEGORIES, Category } from "../constants/categories";

const PREFS_KEY = "@echo/preferred_categories";
const THEME_KEY = "@echo/theme";

const VALID_CATEGORIES = new Set<string>(CATEGORIES);

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
    await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(value));
  } catch (error) {
    warnInDevelopment("Failed to write preferred categories", error);
    throw error;
  }
}

/** Returns the stored theme, or null when the system theme should be used. */
export async function getTheme(): Promise<"light" | "dark" | null> {
  try {
    const value = await AsyncStorage.getItem(THEME_KEY);
    if (value === null) return null;
    if (value === "light" || value === "dark") return value;

    warnInDevelopment("Ignored invalid theme");
    return null;
  } catch (error) {
    warnInDevelopment("Failed to read theme", error);
    return null;
  }
}

/** Saves an explicit light or dark theme preference. */
export async function setTheme(theme: "light" | "dark"): Promise<void> {
  try {
    if (theme !== "light" && theme !== "dark") {
      throw new TypeError("Theme must be light or dark.");
    }

    await AsyncStorage.setItem(THEME_KEY, theme);
  } catch (error) {
    warnInDevelopment("Failed to write theme", error);
    throw error;
  }
}
