import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Alert, Linking } from "react-native";
import { getRandomQuote } from "../data/quotes";

/**
 * Configure notification appearance when app is in foreground.
 */
export function configureNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/**
 * Request notification permissions via pre-permission intro flow.
 * Returns true if permission was granted, false otherwise.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  // Check if running on a real device
  if (!Device.isDevice) {
    Alert.alert(
      "Notifications Unavailable",
      "Notifications require a real device. Simulator does not support push notifications.",
    );
    return false;
  }

  // Check current permission status
  const { status: existingStatus } = await Notifications.getPermissionsAsync();

  if (existingStatus === "granted") {
    return true;
  }

  // Request permission (triggers iOS system dialog)
  const { status } = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });

  if (status === "granted") {
    return true;
  }

  // Permission denied — guide user to Settings
  Alert.alert(
    "Notifications Disabled",
    "Echo needs notification permission to send you daily inspirational quotes. Please enable it in Settings.",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Open Settings",
        onPress: () => Linking.openSettings(),
      },
    ],
  );

  return false;
}

/**
 * Schedule a daily notification at the given time.
 * Quiet Hours: if scheduledHour falls in 22:00–07:00, delay to 07:00.
 */
export async function scheduleDailyReminder(
  hour: number = 9,
  minute: number = 0,
): Promise<void> {
  // Quiet Hours check: if the scheduled time is in quiet zone, push to 7 AM
  if (hour >= 22 || hour < 7) {
    hour = 7;
    minute = 0;
  }

  // Cancel any existing scheduled notifications first
  await Notifications.cancelAllScheduledNotificationsAsync();

  // Pick a random quote for the notification body
  const quote = getRandomQuote([]);

  const body = quote
    ? `"${quote.text}"\n— ${quote.author}`
    : "Start your day with an inspiring quote.";

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "✨ Your Daily Quote",
      body,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

/**
 * Cancel all scheduled notifications.
 */
export async function cancelAllReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Sync the reminder enabled state with actual system permission status.
 * Call this when AppState changes to "active" to handle the case where
 * user enabled notifications in iOS Settings while app was in background.
 */
export async function syncPermissionState(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === "granted";
}
