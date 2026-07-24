import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  REMINDER_TIMES,
  getNotificationCopy,
  normalizeNotificationPreferences,
  parseNotificationPreferences,
  recordQuoteViewed,
  shouldShowNotificationPrimer,
} from "../src/notifications/model";
import {
  disableReminder,
  enableReminder,
  replaceScheduledReminder,
  rescheduleReminder,
  rescheduleReminderLanguage,
} from "../src/notifications/lifecycle";

test("v1 reminder presets map to the intended daily times", () => {
  assert.deepEqual(
    Object.values(REMINDER_TIMES).map(({ hour, minute }) => [hour, minute]),
    [
      [7, 0],
      [12, 0],
      [21, 0],
    ],
  );
});

test("daily reminder copy exists in all three quote languages", () => {
  for (const language of ["en", "zh-Hans", "ja"] as const) {
    const copy = getNotificationCopy(language);
    assert.ok(copy.title.trim());
    assert.ok(copy.body.trim());
  }
});

test("invalid persisted reminder data falls back safely", () => {
  assert.deepEqual(
    normalizeNotificationPreferences(null),
    DEFAULT_NOTIFICATION_PREFERENCES,
  );
  assert.deepEqual(
    normalizeNotificationPreferences({
      enabled: "yes",
      time: "midnight",
      scheduleId: " ",
      quotesViewed: -2,
    }),
    DEFAULT_NOTIFICATION_PREFERENCES,
  );
  assert.deepEqual(
    parseNotificationPreferences("{ definitely-not-json"),
    DEFAULT_NOTIFICATION_PREFERENCES,
  );
});

test("the permission primer appears only after three viewed quotes", () => {
  let preferences = { ...DEFAULT_NOTIFICATION_PREFERENCES };
  for (let index = 0; index < 2; index += 1) {
    preferences = recordQuoteViewed(preferences);
  }
  assert.equal(shouldShowNotificationPrimer(preferences, true), false);

  preferences = recordQuoteViewed(preferences);
  assert.equal(shouldShowNotificationPrimer(preferences, true), true);
  assert.equal(
    shouldShowNotificationPrimer({ ...preferences, primerShown: true }, true),
    false,
  );
  assert.equal(
    shouldShowNotificationPrimer({ ...preferences, enabled: true }, true),
    false,
  );
});

test("view counters are capped once primer eligibility is reached", () => {
  let preferences = { ...DEFAULT_NOTIFICATION_PREFERENCES };
  for (let index = 0; index < 10; index += 1) {
    preferences = recordQuoteViewed(preferences);
  }
  assert.equal(preferences.quotesViewed, 3);
});

test("enabling leaves only one ECHO reminder and persists the new ID", async () => {
  const cancelled: string[] = [];
  const schedule = async (
    _time: "morning" | "noon" | "evening",
    _language: "en" | "zh-Hans" | "ja",
    previousId: string | null,
  ) =>
    replaceScheduledReminder(
      async () => "echo-new",
      async (id) => {
        cancelled.push(id);
      },
      previousId,
    );
  const next = await enableReminder(
    { ...DEFAULT_NOTIFICATION_PREFERENCES, scheduleId: "echo-old" },
    "en",
    async () => "authorized",
    schedule,
  );
  assert.equal(next.enabled, true);
  assert.equal(next.scheduleId, "echo-new");
  assert.deepEqual(cancelled, ["echo-old"]);
});

test("changing time replaces the old schedule ID", async () => {
  const calls: Array<[string, string, string | null]> = [];
  const next = await rescheduleReminder(
    {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      enabled: true,
      scheduleId: "echo-old",
    },
    "morning",
    "ja",
    async (time, language, previousId) => {
      calls.push([time, language, previousId]);
      return "echo-morning";
    },
  );
  assert.deepEqual(calls, [["morning", "ja", "echo-old"]]);
  assert.equal(next.time, "morning");
  assert.equal(next.scheduleId, "echo-morning");
});

test("disabling cancels only ECHO's stored notification ID", async () => {
  const cancelled: Array<string | null> = [];
  const next = await disableReminder(
    {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      enabled: true,
      scheduleId: "echo-owned",
    },
    async (id) => {
      cancelled.push(id);
    },
  );
  assert.deepEqual(cancelled, ["echo-owned"]);
  assert.equal(next.enabled, false);
  assert.equal(next.scheduleId, null);
});

test("permission denial never writes enabled true", async () => {
  let scheduled = false;
  const next = await enableReminder(
    DEFAULT_NOTIFICATION_PREFERENCES,
    "zh-Hans",
    async () => "denied",
    async () => {
      scheduled = true;
      return "unexpected";
    },
  );
  assert.equal(scheduled, false);
  assert.equal(next.enabled, false);
  assert.equal(next.scheduleId, null);
});

test("a scheduling failure preserves the old reminder", async () => {
  const previous = {
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    enabled: true,
    scheduleId: "echo-old",
  };
  await assert.rejects(
    rescheduleReminder(previous, "noon", "en", async () => {
      throw new Error("schedule failed");
    }),
  );
  assert.equal(previous.scheduleId, "echo-old");
  assert.equal(previous.time, "evening");
});

test("failure to cancel the old reminder rolls back the new reminder", async () => {
  const cancelled: string[] = [];
  await assert.rejects(
    replaceScheduledReminder(
      async () => "echo-new",
      async (id) => {
        cancelled.push(id);
        if (id === "echo-old") throw new Error("cancel failed");
      },
      "echo-old",
    ),
  );
  assert.deepEqual(cancelled, ["echo-old", "echo-new"]);
});

test("changing language reschedules an enabled reminder", async () => {
  const calls: Array<[string, string, string | null]> = [];
  const next = await rescheduleReminderLanguage(
    {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      enabled: true,
      scheduleId: "echo-old",
    },
    "zh-Hans",
    async (time, language, previousId) => {
      calls.push([time, language, previousId]);
      return "echo-zh";
    },
  );
  assert.deepEqual(calls, [["evening", "zh-Hans", "echo-old"]]);
  assert.equal(next.scheduleId, "echo-zh");
});

test("a dismissed primer never appears automatically again", () => {
  const dismissed = {
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    quotesViewed: 3,
    primerShown: true,
  };
  assert.equal(shouldShowNotificationPrimer(dismissed, true), false);
  assert.equal(
    shouldShowNotificationPrimer(recordQuoteViewed(dismissed), true),
    false,
  );
});
