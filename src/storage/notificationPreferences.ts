import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  normalizeNotificationPreferences,
  parseNotificationPreferences,
  type NotificationPreferences,
} from "../notifications/model";

const NOTIFICATION_PREFERENCES_KEY = "@echo/notification_preferences_v1";

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  try {
    const raw = await AsyncStorage.getItem(NOTIFICATION_PREFERENCES_KEY);
    return parseNotificationPreferences(raw);
  } catch {
    return { ...DEFAULT_NOTIFICATION_PREFERENCES };
  }
}

export async function setNotificationPreferences(
  preferences: NotificationPreferences,
): Promise<void> {
  const normalized = normalizeNotificationPreferences(preferences);
  await AsyncStorage.setItem(
    NOTIFICATION_PREFERENCES_KEY,
    JSON.stringify(normalized),
  );
}
