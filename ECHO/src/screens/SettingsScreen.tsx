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

interface SettingsScreenProps {
  colors: (typeof COLORS)["light"];
  isDark: boolean;
  onBack: () => void;
  onOpenPersonalization: () => void;
  onOpenTheme: () => void;
  preferredCount: number;
}

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

export default function SettingsScreen({
  colors,
  isDark,
  onBack,
  onOpenPersonalization,
  onOpenTheme,
  preferredCount,
}: SettingsScreenProps) {
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={[styles.backBtn, { backgroundColor: colors.btnBg }]}
          onPress={onBack}
        >
          <Ionicons name="chevron-back" size={20} color={colors.btnIcon} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          SETTINGS
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={[styles.divider, { backgroundColor: colors.divider }]} />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ── Appearance ── */}
        <Text style={[styles.sectionTitle, { color: colors.label }]}>
          APPEARANCE
        </Text>
        <View style={[styles.card, { backgroundColor: colors.btnBg }]}>
          <Pressable style={styles.cardRow} onPress={onOpenTheme}>
            <View style={styles.cardLeft}>
              <Ionicons
                name="color-palette-outline"
                size={20}
                color={colors.btnIcon}
              />
              <Text style={[styles.cardLabel, { color: colors.text }]}>
                Theme
              </Text>
            </View>
            <View style={styles.cardRight}>
              <Text style={[styles.cardValue, { color: colors.author }]}>
                {isDark ? "Dark" : "Light"}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.btnIcon}
              />
            </View>
          </Pressable>
        </View>

        {/* ── Personalization ── */}
        <Text style={[styles.sectionTitle, { color: colors.label }]}>
          PERSONALIZATION
        </Text>
        <View style={[styles.card, { backgroundColor: colors.btnBg }]}>
          <Pressable style={styles.cardRow} onPress={onOpenPersonalization}>
            <View style={styles.cardLeft}>
              <Ionicons
                name="color-filter-outline"
                size={20}
                color={colors.btnIcon}
              />
              <Text style={[styles.cardLabel, { color: colors.text }]}>
                Categories
              </Text>
            </View>
            <View style={styles.cardRight}>
              <Text style={[styles.cardValue, { color: colors.author }]}>
                {preferredCount} Selected
              </Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.btnIcon}
              />
            </View>
          </Pressable>
        </View>

        {/* ── Notifications ── */}
        <Text style={[styles.sectionTitle, { color: colors.label }]}>
          NOTIFICATIONS
        </Text>
        <View style={[styles.card, { backgroundColor: colors.btnBg }]}>
          <View style={styles.cardRow}>
            <View style={styles.cardLeft}>
              <Ionicons
                name="notifications-outline"
                size={20}
                color={colors.btnIcon}
              />
              <Text style={[styles.cardLabel, { color: colors.text }]}>
                Daily Reminder
              </Text>
            </View>
            <Switch
              value={false}
              onValueChange={() => {}}
              trackColor={{ false: colors.inactiveDot, true: colors.label }}
              thumbColor="#fff"
            />
          </View>

          <View
            style={[styles.cardDivider, { backgroundColor: colors.divider }]}
          />

          <Pressable style={styles.cardRow}>
            <View style={styles.cardLeft}>
              <Ionicons name="moon-outline" size={20} color={colors.btnIcon} />
              <Text style={[styles.cardLabel, { color: colors.text }]}>
                Quiet Hours
              </Text>
            </View>
            <View style={styles.cardRight}>
              <Text style={[styles.cardValue, { color: colors.author }]}>
                10:00 PM – 7:00 AM
              </Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.btnIcon}
              />
            </View>
          </Pressable>
        </View>

        {/* ── Languages ── */}
        <Text style={[styles.sectionTitle, { color: colors.label }]}>
          LANGUAGES
        </Text>
        <View style={[styles.card, { backgroundColor: colors.btnBg }]}>
          <View style={styles.cardRow}>
            <View style={styles.cardLeft}>
              <Ionicons name="globe-outline" size={20} color={colors.btnIcon} />
              <Text style={[styles.cardLabel, { color: colors.text }]}>
                Interface Language
              </Text>
            </View>
            <View style={styles.cardRight}>
              <Text style={[styles.cardValue, { color: colors.author }]}>
                English
              </Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.btnIcon}
              />
            </View>
          </View>

          <View
            style={[styles.cardDivider, { backgroundColor: colors.divider }]}
          />

          <View style={[styles.cardRow, { opacity: 0.5 }]}>
            <View style={styles.cardLeft}>
              <Ionicons name="book-outline" size={20} color={colors.btnIcon} />
              <Text style={[styles.cardLabel, { color: colors.text }]}>
                Quote Language
              </Text>
            </View>
            <View style={styles.cardRight}>
              <Text style={[styles.cardValue, { color: colors.author }]}>
                English
              </Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.btnIcon}
              />
            </View>
          </View>
        </View>

        {/* ── Feedback ── */}
        <Text style={[styles.sectionTitle, { color: colors.label }]}>
          FEEDBACK
        </Text>
        <View style={[styles.card, { backgroundColor: colors.btnBg }]}>
          <Pressable style={styles.cardRow} onPress={handleSendFeedback}>
            <View style={styles.cardLeft}>
              <Ionicons name="mail-outline" size={20} color={colors.btnIcon} />
              <Text style={[styles.cardLabel, { color: colors.text }]}>
                Send Feedback
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.btnIcon} />
          </Pressable>

          <View
            style={[styles.cardDivider, { backgroundColor: colors.divider }]}
          />

          <Pressable style={styles.cardRow} onPress={handleShareApp}>
            <View style={styles.cardLeft}>
              <Ionicons name="share-outline" size={20} color={colors.btnIcon} />
              <Text style={[styles.cardLabel, { color: colors.text }]}>
                Share App
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.btnIcon} />
          </Pressable>
        </View>

        {/* ── About ── */}
        <Text style={[styles.sectionTitle, { color: colors.label }]}>
          ABOUT
        </Text>
        <View style={[styles.card, { backgroundColor: colors.btnBg }]}>
          <Pressable
            style={styles.cardRow}
            onPress={() => safeOpenURL(PRIVACY_URL)}
          >
            <View style={styles.cardLeft}>
              <Ionicons
                name="document-text-outline"
                size={20}
                color={colors.btnIcon}
              />
              <Text style={[styles.cardLabel, { color: colors.text }]}>
                Privacy Policy
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.btnIcon} />
          </Pressable>

          <View
            style={[styles.cardDivider, { backgroundColor: colors.divider }]}
          />

          <Pressable
            style={styles.cardRow}
            onPress={() => safeOpenURL(TERMS_URL)}
          >
            <View style={styles.cardLeft}>
              <Ionicons
                name="shield-checkmark-outline"
                size={20}
                color={colors.btnIcon}
              />
              <Text style={[styles.cardLabel, { color: colors.text }]}>
                Terms of Service
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.btnIcon} />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

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
