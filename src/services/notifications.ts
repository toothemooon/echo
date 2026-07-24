import { Linking, Platform } from "react-native";
import * as Notifications from "expo-notifications";
import type { QuoteLanguage } from "../data/quotes";
import {
  REMINDER_TIMES,
  getNotificationCopy,
  type NotificationPermissionState,
  type ReminderTime,
} from "../notifications/model";
import { replaceScheduledReminder } from "../notifications/lifecycle";

const DAILY_REMINDER_CHANNEL = "daily-reminders";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function configureNotificationChannel(): Promise<void> {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync(DAILY_REMINDER_CHANNEL, {
    name: "Daily quote reminders",
    description: "One quiet reminder from ECHO each day.",
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 180],
    lightColor: "#496946",
  });
}

function isAuthorized(
  settings: Notifications.NotificationPermissionsStatus,
): boolean {
  return (
    settings.granted ||
    settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

export async function getNotificationPermissionState(): Promise<NotificationPermissionState> {
  const settings = await Notifications.getPermissionsAsync();
  if (isAuthorized(settings)) return "authorized";
  return settings.status === Notifications.PermissionStatus.DENIED
    ? "denied"
    : "undetermined";
}

export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  await configureNotificationChannel();
  const current = await Notifications.getPermissionsAsync();
  if (isAuthorized(current)) return "authorized";
  if (
    current.status === Notifications.PermissionStatus.DENIED &&
    !current.canAskAgain
  ) {
    return "denied";
  }

  const requested = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: false,
      allowSound: true,
    },
  });
  return isAuthorized(requested) ? "authorized" : "denied";
}

export async function scheduleDailyReminder(
  time: ReminderTime,
  language: QuoteLanguage,
  previousScheduleId: string | null,
): Promise<string> {
  await configureNotificationChannel();
  const selectedTime = REMINDER_TIMES[time];
  const copy = getNotificationCopy(language);
  return replaceScheduledReminder(
    () =>
      Notifications.scheduleNotificationAsync({
        content: {
          title: copy.title,
          body: copy.body,
          sound: "default",
          data: {
            kind: "daily-quote",
            url: "echo:///",
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: selectedTime.hour,
          minute: selectedTime.minute,
          channelId: DAILY_REMINDER_CHANNEL,
        },
      }),
    (scheduleId) =>
      Notifications.cancelScheduledNotificationAsync(scheduleId),
    previousScheduleId,
  );
}

export async function cancelDailyReminder(
  scheduleId: string | null,
): Promise<void> {
  if (!scheduleId) return;
  await Notifications.cancelScheduledNotificationAsync(scheduleId);
}

export function addDailyReminderResponseListener(
  onOpen: () => void,
): Notifications.EventSubscription {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    if (response.notification.request.content.data?.kind === "daily-quote") {
      onOpen();
    }
  });
}

export async function openSystemNotificationSettings(): Promise<void> {
  await Linking.openSettings();
}

export async function scheduleDevelopmentTestNotification(): Promise<void> {
  if (!__DEV__) return;
  await configureNotificationChannel();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "ECHO notification test",
      body: "Local notifications are configured correctly.",
      data: { kind: "daily-quote" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 60,
      channelId: DAILY_REMINDER_CHANNEL,
    },
  });
}
