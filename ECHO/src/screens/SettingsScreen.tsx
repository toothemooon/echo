import {
  View,
  Text,
  Pressable,
  Switch,
  StyleSheet,
  Linking,
  Alert,
  Share,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";

type Props = {
  colors: typeof COLORS.light;
  isDark: boolean;
  reminderEnabled: boolean;
  onToggleReminder: () => void;
  onBack: () => void;
  onOpenPersonalization: () => void;
  onOpenTheme: () => void;
  preferredCount: number;
};

// ══════════════════════════════════════════════
//  SettingsScreen — 设置页面
//  分区展示：Preference / Widgets / Notifications / Feedback / About
//  通过 props 接收状态和回调，不直接修改 State
// ══════════════════════════════════════════════

// ── Props ──

// ── 常量 ──
const FEEDBACK_EMAIL = "mailto:feedback@echo.app?subject=Echo%20Feedback";
const PRIVACY_URL = "https://echo.app/privacy";
const TERMS_URL = "https://echo.app/terms";

async function safeOpenURL(url: string) {
  try {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      Alert.alert("Unable to open", url);
    }
  } catch (_error) {
    Alert.alert("Unable to open", url);
  }
}

export default function SettingsScreen(props: Props) {
  const handleShareApp = () => {
    Share.share({
      message:
        "Check out Echo — a daily quote generator app!\nhttps://apps.apple.com/app/echo/id0000000000",
      url: "https://apps.apple.com/app/echo/id0000000000",
      title: "Echo",
    });
  };

  const handleSendFeedback = () => {
    safeOpenURL(FEEDBACK_EMAIL);
  };

  return (
    <View
      style={[styles.container, { backgroundColor: props.colors.background }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={[styles.backBtn, { backgroundColor: props.colors.btnBg }]}
          onPress={props.onBack}
        >
          <Ionicons
            name="chevron-back"
            size={20}
            color={props.colors.btnIcon}
          />
        </Pressable>
        <Text style={[styles.headerTitle, { color: props.colors.text }]}>
          SETTINGS
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <View
        style={[styles.divider, { backgroundColor: props.colors.divider }]}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ── Preference (Theme + Categories + Language) ── */}
        <Text style={[styles.sectionTitle, { color: props.colors.label }]}>
          PREFERENCE
        </Text>
        <View style={[styles.card, { backgroundColor: props.colors.btnBg }]}>
          <Pressable style={styles.cardRow} onPress={props.onOpenTheme}>
            <View style={styles.cardLeft}>
              <Ionicons
                name="color-palette-outline"
                size={20}
                color={props.colors.btnIcon}
              />
              <Text style={[styles.cardLabel, { color: props.colors.text }]}>
                Theme
              </Text>
            </View>
            <View style={styles.cardRight}>
              <Text style={[styles.cardValue, { color: props.colors.author }]}>
                {props.isDark ? "Dark" : "Light"}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={props.colors.btnIcon}
              />
            </View>
          </Pressable>

          <View
            style={[
              styles.cardDivider,
              { backgroundColor: props.colors.divider },
            ]}
          />

          <Pressable
            style={styles.cardRow}
            onPress={props.onOpenPersonalization}
          >
            <View style={styles.cardLeft}>
              <Ionicons
                name="color-filter-outline"
                size={20}
                color={props.colors.btnIcon}
              />
              <Text style={[styles.cardLabel, { color: props.colors.text }]}>
                Categories
              </Text>
            </View>
            <View style={styles.cardRight}>
              <Text style={[styles.cardValue, { color: props.colors.author }]}>
                {props.preferredCount} Selected
              </Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={props.colors.btnIcon}
              />
            </View>
          </Pressable>

          <View
            style={[
              styles.cardDivider,
              { backgroundColor: props.colors.divider },
            ]}
          />

          <View style={styles.cardRow}>
            <View style={styles.cardLeft}>
              <Ionicons
                name="globe-outline"
                size={20}
                color={props.colors.btnIcon}
              />
              <Text style={[styles.cardLabel, { color: props.colors.text }]}>
                Interface Language
              </Text>
            </View>
            <View style={styles.cardRight}>
              <Text style={[styles.cardValue, { color: props.colors.author }]}>
                English
              </Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={props.colors.btnIcon}
              />
            </View>
          </View>
        </View>

        {/* ── Widgets ── */}
        <Text style={[styles.sectionTitle, { color: props.colors.label }]}>
          WIDGETS
        </Text>
        <View style={[styles.card, { backgroundColor: props.colors.btnBg }]}>
          <View style={styles.cardRow}>
            <View style={styles.cardLeft}>
              <Ionicons
                name="phone-portrait-outline"
                size={20}
                color={props.colors.btnIcon}
              />
              <Text style={[styles.cardLabel, { color: props.colors.text }]}>
                Widget Settings
              </Text>
            </View>
            <Text
              style={[
                styles.cardValue,
                { color: props.colors.author, opacity: 0.5 },
              ]}
            >
              Coming Soon
            </Text>
          </View>
        </View>

        {/* ── Notifications ── */}
        <Text style={[styles.sectionTitle, { color: props.colors.label }]}>
          NOTIFICATIONS
        </Text>
        <View style={[styles.card, { backgroundColor: props.colors.btnBg }]}>
          <View style={styles.cardRow}>
            <View style={styles.cardLeft}>
              <Ionicons
                name="notifications-outline"
                size={20}
                color={props.colors.btnIcon}
              />
              <Text style={[styles.cardLabel, { color: props.colors.text }]}>
                Daily Reminder
              </Text>
            </View>
            <Switch
              value={props.reminderEnabled}
              onValueChange={props.onToggleReminder}
              trackColor={{
                false: props.colors.inactiveDot,
                true: props.colors.label,
              }}
              thumbColor="#fff"
            />
          </View>

          <View
            style={[
              styles.cardDivider,
              { backgroundColor: props.colors.divider },
            ]}
          />

          <Pressable style={styles.cardRow}>
            <View style={styles.cardLeft}>
              <Ionicons
                name="moon-outline"
                size={20}
                color={props.colors.btnIcon}
              />
              <Text style={[styles.cardLabel, { color: props.colors.text }]}>
                Quiet Hours
              </Text>
            </View>
            <View style={styles.cardRight}>
              <Text style={[styles.cardValue, { color: props.colors.author }]}>
                10:00 PM – 7:00 AM
              </Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={props.colors.btnIcon}
              />
            </View>
          </Pressable>
        </View>

        {/* ── Feedback ── */}
        <Text style={[styles.sectionTitle, { color: props.colors.label }]}>
          FEEDBACK
        </Text>
        <View style={[styles.card, { backgroundColor: props.colors.btnBg }]}>
          <Pressable style={styles.cardRow} onPress={handleSendFeedback}>
            <View style={styles.cardLeft}>
              <Ionicons
                name="mail-outline"
                size={20}
                color={props.colors.btnIcon}
              />
              <Text style={[styles.cardLabel, { color: props.colors.text }]}>
                Send Feedback
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={props.colors.btnIcon}
            />
          </Pressable>

          <View
            style={[
              styles.cardDivider,
              { backgroundColor: props.colors.divider },
            ]}
          />

          <Pressable style={styles.cardRow} onPress={handleShareApp}>
            <View style={styles.cardLeft}>
              <Ionicons
                name="share-outline"
                size={20}
                color={props.colors.btnIcon}
              />
              <Text style={[styles.cardLabel, { color: props.colors.text }]}>
                Share App
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={props.colors.btnIcon}
            />
          </Pressable>
        </View>

        {/* ── About ── */}
        <Text style={[styles.sectionTitle, { color: props.colors.label }]}>
          ABOUT
        </Text>
        <View style={[styles.card, { backgroundColor: props.colors.btnBg }]}>
          <Pressable
            style={styles.cardRow}
            onPress={() => safeOpenURL(PRIVACY_URL)}
          >
            <View style={styles.cardLeft}>
              <Ionicons
                name="document-text-outline"
                size={20}
                color={props.colors.btnIcon}
              />
              <Text style={[styles.cardLabel, { color: props.colors.text }]}>
                Privacy Policy
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={props.colors.btnIcon}
            />
          </Pressable>

          <View
            style={[
              styles.cardDivider,
              { backgroundColor: props.colors.divider },
            ]}
          />

          <Pressable
            style={styles.cardRow}
            onPress={() => safeOpenURL(TERMS_URL)}
          >
            <View style={styles.cardLeft}>
              <Ionicons
                name="shield-checkmark-outline"
                size={20}
                color={props.colors.btnIcon}
              />
              <Text style={[styles.cardLabel, { color: props.colors.text }]}>
                Terms of Service ～
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={props.colors.btnIcon}
            />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

// ── 样式 ──
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: "500",
    letterSpacing: 3,
    textTransform: "uppercase",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginTop: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 3,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  card: {
    borderRadius: 16,
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: "400",
  },
  cardValue: {
    fontSize: 14,
  },
  cardDivider: {
    height: StyleSheet.hairlineWidth,
  },
});
