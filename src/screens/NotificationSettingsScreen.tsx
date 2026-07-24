import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ArchiveBackground from "../components/common/ArchiveBackground";
import { COLORS } from "../constants/colors";
import {
  REMINDER_TIMES,
  type NotificationPermissionState,
  type ReminderTime,
} from "../notifications/model";
import type { ThemeMode } from "../storage/preferences";

type Props = {
  colors: typeof COLORS.light;
  theme: ThemeMode;
  enabled: boolean;
  time: ReminderTime;
  permission: NotificationPermissionState;
  busy: boolean;
  onToggle: (enabled: boolean) => void;
  onChangeTime: (time: ReminderTime) => void;
  onOpenSystemSettings: () => void;
  onTestNotification: () => void;
  onBack: () => void;
};

export default function NotificationSettingsScreen(props: Props) {
  return (
    <View style={[styles.container, { backgroundColor: props.colors.background }]}>
      <ArchiveBackground theme={props.theme} />
      <View style={styles.header}>
        <Pressable
          style={[styles.backButton, { backgroundColor: props.colors.btnBg }]}
          onPress={props.onBack}
          accessibilityRole="button"
          accessibilityLabel="Back to Settings"
          hitSlop={10}
        >
          <Ionicons name="chevron-back" size={20} color={props.colors.btnIcon} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: props.colors.text }]}>
          NOTIFICATIONS
        </Text>
        <View style={styles.placeholder} />
      </View>
      <View style={[styles.divider, { backgroundColor: props.colors.divider }]} />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.intro, { color: props.colors.author }]}>
          One quiet reminder per day. ECHO never sends promotional notifications.
        </Text>

        <View style={[styles.card, { backgroundColor: props.colors.btnBg }]}>
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={[styles.rowTitle, { color: props.colors.text }]}>
                Daily Reminder
              </Text>
              <Text style={[styles.rowDescription, { color: props.colors.author }]}>
                {props.enabled
                  ? REMINDER_TIMES[props.time].label
                  : "Off"}
              </Text>
            </View>
            {props.busy ? (
              <ActivityIndicator color={props.colors.label} />
            ) : (
              <Switch
                value={props.enabled}
                onValueChange={props.onToggle}
                accessibilityLabel="Daily Reminder"
                trackColor={{ false: props.colors.divider, true: props.colors.label }}
                thumbColor={props.colors.text}
              />
            )}
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: props.colors.label }]}>
          DELIVERY TIME
        </Text>
        <View style={[styles.card, { backgroundColor: props.colors.btnBg }]}>
          {(Object.keys(REMINDER_TIMES) as ReminderTime[]).map((time, index, all) => (
            <View key={time}>
              <Pressable
                style={styles.row}
                onPress={() => props.onChangeTime(time)}
                disabled={!props.enabled || props.busy}
                accessibilityRole="radio"
                accessibilityLabel={REMINDER_TIMES[time].label}
                accessibilityState={{
                  selected: props.time === time,
                  disabled: !props.enabled || props.busy,
                }}
              >
                <Text
                  style={[
                    styles.rowTitle,
                    {
                      color: props.enabled
                        ? props.colors.text
                        : props.colors.author,
                    },
                  ]}
                >
                  {REMINDER_TIMES[time].label}
                </Text>
                {props.time === time ? (
                  <Ionicons name="checkmark" size={21} color={props.colors.label} />
                ) : null}
              </Pressable>
              {index < all.length - 1 ? (
                <View style={[styles.rowDivider, { backgroundColor: props.colors.divider }]} />
              ) : null}
            </View>
          ))}
        </View>

        <Text style={[styles.permission, { color: props.colors.author }]}>
          System permission: {props.permission}
        </Text>

        {props.permission === "denied" ? (
          <Pressable
            style={[styles.secondaryButton, { borderColor: props.colors.label }]}
            onPress={props.onOpenSystemSettings}
            accessibilityRole="button"
            accessibilityLabel="Open System Notification Settings"
          >
            <Text style={[styles.secondaryLabel, { color: props.colors.text }]}>
              Open System Settings
            </Text>
          </Pressable>
        ) : null}

        {__DEV__ ? (
          <Pressable
            style={[styles.secondaryButton, { borderColor: props.colors.divider }]}
            onPress={props.onTestNotification}
            accessibilityRole="button"
            accessibilityLabel="Schedule a test notification in 60 seconds"
          >
            <Text style={[styles.secondaryLabel, { color: props.colors.text }]}>
              Test in 60 Seconds
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, paddingHorizontal: 32 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { flexShrink: 1, fontSize: 14, fontWeight: "600", letterSpacing: 2.3 },
  placeholder: { width: 44 },
  divider: { height: StyleSheet.hairlineWidth, marginTop: 24 },
  content: { paddingTop: 28, paddingBottom: 56 },
  intro: { fontSize: 15, lineHeight: 23, marginBottom: 24 },
  sectionTitle: { marginTop: 28, marginBottom: 12, fontSize: 12, fontWeight: "600", letterSpacing: 2.3 },
  card: { borderRadius: 16, paddingHorizontal: 18 },
  row: { minHeight: 68, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 16, paddingVertical: 12 },
  rowText: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: 16, lineHeight: 22, flexShrink: 1 },
  rowDescription: { marginTop: 3, fontSize: 13, lineHeight: 19 },
  rowDivider: { height: StyleSheet.hairlineWidth },
  permission: { marginTop: 20, fontSize: 13, lineHeight: 19 },
  secondaryButton: {
    minHeight: 50,
    marginTop: 16,
    borderWidth: 1,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  secondaryLabel: { fontSize: 15, lineHeight: 21, textAlign: "center" },
});
