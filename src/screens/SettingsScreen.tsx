import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Linking,
  Alert,
  ScrollView,
  Share,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";
import type {
  QuoteAnimation,
  QuoteLanguagePreference,
  ThemeMode,
} from "../storage/preferences";
import ArchiveBackground from "../components/common/ArchiveBackground";

type Props = {
  colors: typeof COLORS.light;
  theme: ThemeMode;
  onBack: () => void;
  onOpenPersonalization: () => void;
  onOpenTheme: () => void;
  onOpenQuoteSettings: () => void;
  onOpenLanguageSettings: () => void;
  onOpenAnimationSettings: () => void;
  onOpenAccessibility: () => void;
  onOpenContentSources: () => void;
  onClearData: () => Promise<void>;
  quoteLanguage: QuoteLanguagePreference;
  quoteAnimation: QuoteAnimation;
  preferenceSummary: string;
  appVersion: string;
  buildVersion: string;
};

const FEEDBACK_EMAIL = "abc510433622@gmail.com";
const PRIVACY_URL = "https://sarada.yachts/projects/echo/privacy";
const TERMS_URL = "https://sarada.yachts/projects/echo/terms";
const APP_URL = "https://sarada.yachts/projects/echo";

const THEME_LABELS: Record<ThemeMode, string> = {
  light: "Light",
  dark: "Dark",
  archive: "Archive",
};

const ANIMATION_LABELS: Record<QuoteAnimation, string> = {
  fade: "Fade",
  horizontal: "Horizontal",
  none: "None",
};

const LANGUAGE_LABELS: Record<QuoteLanguagePreference, string> = {
  en: "English",
  "zh-Hans": "简体中文",
  ja: "日本語",
};

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
    const message =
      `ECHO — Daily Quotes\n\n`
      + `A quiet, offline-first quote reader.\n\n`
      + `${APP_URL}`;

    Alert.alert("Share App", message, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Copy Link",
        onPress: () => {
          void Clipboard.setStringAsync(APP_URL);
        },
      },
    ]);
  };

  const handleClearData = () => {
    Alert.alert(
      "Clear All Data?",
      "This removes saved quotes, reading history, themes, preferences, and onboarding data from this device.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear Data",
          style: "destructive",
          onPress: () => {
            void props.onClearData();
          },
        },
      ],
    );
  };

  const handleSendFeedback = () => {
    const message =
      `Your thoughts help make ECHO better.\n\n`
      + `Feel free to send me your feedback, ideas, or suggestions. `
      + `Every message is read and greatly appreciated.\n\n`
      + `${FEEDBACK_EMAIL}`;

    Alert.alert("Send Feedback", message, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Copy Email",
        onPress: () => {
          void Clipboard.setStringAsync(FEEDBACK_EMAIL);
        },
      },
    ]);
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: props.colors.background,
        },
      ]}
    >
      <ArchiveBackground theme={props.theme} />
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={[
            styles.backBtn,
            {
              backgroundColor: props.colors.btnBg,
            },
          ]}
          onPress={props.onBack}
          accessibilityRole="button"
          accessibilityLabel="Back to Quotes"
          hitSlop={10}
        >
          <Ionicons
            name="chevron-back"
            size={20}
            color={props.colors.btnIcon}
          />
        </Pressable>

        <Text
          style={[
            styles.headerTitle,
            {
              color: props.colors.text,
            },
          ]}
        >
          SETTINGS
        </Text>

        <View style={styles.headerPlaceholder} />
      </View>

      <View
        style={[
          styles.divider,
          {
            backgroundColor: props.colors.divider,
          },
        ]}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Preference */}
        <Text
          style={[
            styles.sectionTitle,
            {
              color: props.colors.label,
            },
          ]}
        >
          PREFERENCE
        </Text>

        <View
          style={[
            styles.card,
            {
              backgroundColor: props.colors.btnBg,
            },
          ]}
        >
          {/* Theme */}
          <Pressable style={styles.cardRow} onPress={props.onOpenTheme} accessibilityRole="button" accessibilityLabel="Theme Settings">
            <View style={styles.cardLeft}>
              <Ionicons
                name="color-palette-outline"
                size={20}
                color={props.colors.btnIcon}
              />

              <Text
                style={[
                  styles.cardLabel,
                  {
                    color: props.colors.text,
                  },
                ]}
              >
                Theme
              </Text>
            </View>

            <View style={styles.cardRight}>
              <Text
                style={[
                  styles.cardValue,
                  {
                    color: props.colors.author,
                  },
                ]}
              >
                {THEME_LABELS[props.theme]}
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
              {
                backgroundColor: props.colors.divider,
              },
            ]}
          />

          {/* Reading preference */}
          <Pressable
            style={styles.cardRow}
            onPress={props.onOpenPersonalization}
            accessibilityRole="button"
            accessibilityLabel="Preferences"
          >
            <View style={styles.cardLeft}>
              <Ionicons
                name="color-filter-outline"
                size={20}
                color={props.colors.btnIcon}
              />

              <Text
                style={[
                  styles.cardLabel,
                  {
                    color: props.colors.text,
                  },
                ]}
              >
                Preferences
              </Text>
            </View>

            <View style={styles.cardRight}>
              <Text
                style={[
                  styles.cardValue,
                  {
                    color: props.colors.author,
                  },
                ]}
              >
                {props.preferenceSummary}
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
              {
                backgroundColor: props.colors.divider,
              },
            ]}
          />

          {/* Quote language */}
          <Pressable
            style={styles.cardRow}
            onPress={props.onOpenLanguageSettings}
            accessibilityRole="button"
            accessibilityLabel="Quote Language"
          >
            <View style={styles.cardLeft}>
              <Ionicons
                name="language-outline"
                size={20}
                color={props.colors.btnIcon}
              />

              <Text
                style={[
                  styles.cardLabel,
                  {
                    color: props.colors.text,
                  },
                ]}
              >
                Quote Language
              </Text>
            </View>

            <View style={styles.cardRight}>
              <Text
                style={[
                  styles.cardValue,
                  {
                    color: props.colors.author,
                  },
                ]}
              >
                {LANGUAGE_LABELS[props.quoteLanguage]}
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
              {
                backgroundColor: props.colors.divider,
              },
            ]}
          />

          {/* Quote Settings */}
          <Pressable style={styles.cardRow} onPress={props.onOpenQuoteSettings} accessibilityRole="button" accessibilityLabel="Quote Settings">
            <View style={styles.cardLeft}>
              <Ionicons
                name="text-outline"
                size={20}
                color={props.colors.btnIcon}
              />

              <Text
                style={[
                  styles.cardLabel,
                  {
                    color: props.colors.text,
                  },
                ]}
              >
                Quote Settings
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

          {/* Animation */}
          <Pressable
            style={styles.cardRow}
            onPress={props.onOpenAnimationSettings}
            accessibilityRole="button"
            accessibilityLabel="Animation Settings"
          >
            <View style={styles.cardLeft}>
              <Ionicons
                name="sparkles-outline"
                size={20}
                color={props.colors.btnIcon}
              />
              <Text style={[styles.cardLabel, { color: props.colors.text }]}>Animation</Text>
            </View>

            <View style={styles.cardRight}>
              <Text style={[styles.cardValue, { color: props.colors.author }]}>
                {ANIMATION_LABELS[props.quoteAnimation]}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={props.colors.btnIcon}
              />
            </View>
          </Pressable>
        </View>

        <Text style={[styles.sectionTitle, { color: props.colors.label }]}>
          ACCESSIBILITY
        </Text>
        <View style={[styles.card, { backgroundColor: props.colors.btnBg }]}>
          <Pressable
            style={styles.cardRow}
            onPress={props.onOpenAccessibility}
            accessibilityRole="button"
            accessibilityLabel="Accessibility Settings"
            accessibilityHint="VoiceOver, Dynamic Type, and color contrast options"
          >
            <View style={styles.cardLeft}>
              <Ionicons
                name="accessibility-outline"
                size={20}
                color={props.colors.btnIcon}
              />
              <Text style={[styles.cardLabel, { color: props.colors.text }]}>
                Accessibility
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={props.colors.btnIcon}
            />
          </Pressable>
        </View>

        {/* Feedback */}
        <Text
          style={[
            styles.sectionTitle,
            {
              color: props.colors.label,
            },
          ]}
        >
          FEEDBACK
        </Text>

        <View
          style={[
            styles.card,
            {
              backgroundColor: props.colors.btnBg,
            },
          ]}
        >
          <Pressable
            style={styles.cardRow}
            onPress={handleSendFeedback}
            accessibilityRole="button"
            accessibilityLabel="Send Feedback"
            accessibilityHint="Copy the feedback email address or open Mail"
          >
            <View style={styles.cardLeft}>
              <Ionicons
                name="mail-outline"
                size={20}
                color={props.colors.btnIcon}
              />

              <Text
                style={[
                  styles.cardLabel,
                  {
                    color: props.colors.text,
                  },
                ]}
              >
                Send Feedback
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={16}
              color={props.colors.btnIcon}
            />
          </Pressable>

        </View>

        {/* About */}
        <Text
          style={[
            styles.sectionTitle,
            {
              color: props.colors.label,
            },
          ]}
        >
          ABOUT
        </Text>

        <View
          style={[
            styles.card,
            {
              backgroundColor: props.colors.btnBg,
            },
          ]}
        >
          <Pressable
            style={styles.cardRow}
            onPress={() => {
              void safeOpenURL(PRIVACY_URL);
            }}
            accessibilityRole="button"
            accessibilityLabel="Privacy Policy"
          >
            <View style={styles.cardLeft}>
              <Ionicons
                name="document-text-outline"
                size={20}
                color={props.colors.btnIcon}
              />

              <Text
                style={[
                  styles.cardLabel,
                  {
                    color: props.colors.text,
                  },
                ]}
              >
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
              {
                backgroundColor: props.colors.divider,
              },
            ]}
          />

          <Pressable
            style={styles.cardRow}
            onPress={() => {
              void safeOpenURL(TERMS_URL);
            }}
            accessibilityRole="button"
            accessibilityLabel="Terms of Service"
          >
            <View style={styles.cardLeft}>
              <Ionicons
                name="shield-checkmark-outline"
                size={20}
                color={props.colors.btnIcon}
              />

              <Text
                style={[
                  styles.cardLabel,
                  {
                    color: props.colors.text,
                  },
                ]}
              >
                Terms of Service
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
            onPress={props.onOpenContentSources}
            accessibilityRole="button"
            accessibilityLabel="Content Sources and Licensing"
          >
            <View style={styles.cardLeft}>
              <Ionicons
                name="library-outline"
                size={20}
                color={props.colors.btnIcon}
              />
              <Text style={[styles.cardLabel, { color: props.colors.text }]}>
                Content Sources
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={props.colors.btnIcon}
            />
          </Pressable>
        </View>

        <Text style={[styles.sectionTitle, { color: props.colors.label }]}>
          APP
        </Text>
        <View style={[styles.card, { backgroundColor: props.colors.btnBg }]}>
          <Pressable
            style={styles.cardRow}
            onPress={() => {
              void handleShareApp();
            }}
            accessibilityRole="button"
            accessibilityLabel="Share ECHO App"
          >
            <View style={styles.cardLeft}>
              <Ionicons
                name="share-social-outline"
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

          <View
            style={[
              styles.cardDivider,
              { backgroundColor: props.colors.divider },
            ]}
          />

          <Pressable
            style={styles.cardRow}
            onPress={handleClearData}
            accessibilityRole="button"
            accessibilityLabel="Clear All Local Data"
          >
            <View style={styles.cardLeft}>
              <Ionicons
                name="trash-outline"
                size={20}
                color={props.colors.btnIcon}
              />
              <Text style={[styles.cardLabel, { color: props.colors.text }]}>
                Clear All Data
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={props.colors.btnIcon}
            />
          </Pressable>
        </View>

        <Text style={[styles.version, { color: props.colors.author }]}>
          Version {props.appVersion} ({props.buildVersion})
        </Text>
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
  headerPlaceholder: {
    width: 40,
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
  scrollContent: {
    paddingBottom: 20,
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
    flexShrink: 1,
    minWidth: 0,
  },
  cardRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    maxWidth: "48%",
    minWidth: 0,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: "400",
    flexShrink: 1,
  },
  cardValue: {
    fontSize: 14,
    flexShrink: 1,
    textAlign: "right",
  },
  version: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 20,
  },
  cardDivider: {
    height: StyleSheet.hairlineWidth,
  },
});
