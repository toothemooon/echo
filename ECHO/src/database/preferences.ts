import AsyncStorage from "@react-native-async-storage/async-storage";
import { CATEGORIES, Category } from "../constants/categories";

const PREFS_KEY = "@echo/preferred_categories";

/**
 * Get user's preferred categories.
 * Returns all 8 categories as default if nothing is saved.
 */
export async function getPreferredCategories(): Promise<Category[]> {
  try {
    const json = await AsyncStorage.getItem(PREFS_KEY);
    if (json) {
      const parsed: Category[] = JSON.parse(json);
      // Validate: only include known categories
      return parsed.filter((c) =>
        (CATEGORIES as readonly string[]).includes(c),
      );
    }
  } catch (_error) {
    // Fall through to default
  }
  return [...CATEGORIES];
}

/**
 * Save user's preferred categories.
 */
export async function setPreferredCategories(
  categories: Category[],
): Promise<void> {
  await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(categories));
}
