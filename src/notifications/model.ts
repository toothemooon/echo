import type { QuoteLanguage } from "../data/quotes";

export type ReminderTime = "morning" | "noon" | "evening";
export type NotificationPermissionState =
  | "authorized"
  | "denied"
  | "undetermined";

export type NotificationPreferences = {
  enabled: boolean;
  time: ReminderTime;
  scheduleId: string | null;
  primerShown: boolean;
  quotesViewed: number;
};

export const REMINDER_TIMES: Record<
  ReminderTime,
  { hour: number; minute: number; label: string }
> = {
  morning: { hour: 7, minute: 0, label: "Morning · 07:00" },
  noon: { hour: 12, minute: 0, label: "Noon · 12:00" },
  evening: { hour: 21, minute: 0, label: "Evening · 21:00" },
};

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  enabled: false,
  time: "evening",
  scheduleId: null,
  primerShown: false,
  quotesViewed: 0,
};

const NOTIFICATION_COPY = {
  en: {
    title: "A quiet moment for today",
    body: "Your daily quote is waiting in ECHO.",
  },
  "zh-Hans": {
    title: "留一分钟给今天",
    body: "今天的一句话正在 ECHO 等你。",
  },
  ja: {
    title: "今日の静かなひととき",
    body: "今日の言葉が ECHO で待っています。",
  },
} as const;

export function getNotificationCopy(language: QuoteLanguage) {
  return NOTIFICATION_COPY[language];
}

export function normalizeNotificationPreferences(
  value: unknown,
): NotificationPreferences {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return { ...DEFAULT_NOTIFICATION_PREFERENCES };
  }

  const candidate = value as Partial<NotificationPreferences>;
  const time =
    candidate.time === "morning" ||
    candidate.time === "noon" ||
    candidate.time === "evening"
      ? candidate.time
      : DEFAULT_NOTIFICATION_PREFERENCES.time;

  return {
    enabled: candidate.enabled === true,
    time,
    scheduleId:
      typeof candidate.scheduleId === "string" &&
      candidate.scheduleId.trim().length > 0
        ? candidate.scheduleId
        : null,
    primerShown: candidate.primerShown === true,
    quotesViewed:
      typeof candidate.quotesViewed === "number" &&
      Number.isInteger(candidate.quotesViewed) &&
      candidate.quotesViewed >= 0
        ? candidate.quotesViewed
        : 0,
  };
}

export function parseNotificationPreferences(
  raw: string | null,
): NotificationPreferences {
  if (!raw) return { ...DEFAULT_NOTIFICATION_PREFERENCES };
  try {
    return normalizeNotificationPreferences(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_NOTIFICATION_PREFERENCES };
  }
}

export function shouldShowNotificationPrimer(
  preferences: NotificationPreferences,
  onboardingComplete: boolean,
): boolean {
  return (
    onboardingComplete &&
    !preferences.enabled &&
    !preferences.primerShown &&
    preferences.quotesViewed >= 3
  );
}

export function recordQuoteViewed(
  preferences: NotificationPreferences,
): NotificationPreferences {
  return {
    ...preferences,
    quotesViewed: Math.min(preferences.quotesViewed + 1, 3),
  };
}
