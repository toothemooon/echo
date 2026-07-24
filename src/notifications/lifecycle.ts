import type { QuoteLanguage } from "../data/quotes";
import type {
  NotificationPermissionState,
  NotificationPreferences,
  ReminderTime,
} from "./model";

export type ReminderScheduler = (
  time: ReminderTime,
  language: QuoteLanguage,
  previousScheduleId: string | null,
) => Promise<string>;

export async function replaceScheduledReminder(
  create: () => Promise<string>,
  cancel: (scheduleId: string) => Promise<void>,
  previousScheduleId: string | null,
): Promise<string> {
  const nextScheduleId = await create();
  if (previousScheduleId && previousScheduleId !== nextScheduleId) {
    try {
      await cancel(previousScheduleId);
    } catch (error) {
      await cancel(nextScheduleId);
      throw error;
    }
  }
  return nextScheduleId;
}

export async function enableReminder(
  preferences: NotificationPreferences,
  language: QuoteLanguage,
  requestPermission: () => Promise<NotificationPermissionState>,
  schedule: ReminderScheduler,
): Promise<NotificationPreferences> {
  const permission = await requestPermission();
  if (permission !== "authorized") {
    return { ...preferences, enabled: false, primerShown: true };
  }

  const scheduleId = await schedule(
    preferences.time,
    language,
    preferences.scheduleId,
  );
  return {
    ...preferences,
    enabled: true,
    scheduleId,
    primerShown: true,
  };
}

export async function disableReminder(
  preferences: NotificationPreferences,
  cancel: (scheduleId: string | null) => Promise<void>,
): Promise<NotificationPreferences> {
  await cancel(preferences.scheduleId);
  return {
    ...preferences,
    enabled: false,
    scheduleId: null,
    primerShown: true,
  };
}

export async function rescheduleReminder(
  preferences: NotificationPreferences,
  time: ReminderTime,
  language: QuoteLanguage,
  schedule: ReminderScheduler,
): Promise<NotificationPreferences> {
  const scheduleId = await schedule(time, language, preferences.scheduleId);
  return { ...preferences, time, scheduleId };
}

export async function rescheduleReminderLanguage(
  preferences: NotificationPreferences,
  language: QuoteLanguage,
  schedule: ReminderScheduler,
): Promise<NotificationPreferences> {
  if (!preferences.enabled) return preferences;
  const scheduleId = await schedule(
    preferences.time,
    language,
    preferences.scheduleId,
  );
  return { ...preferences, scheduleId };
}
