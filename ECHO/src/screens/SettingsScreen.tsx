import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Linking,
  Alert,
  ScrollView,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";
import type { ThemeMode } from "../storage/preferences";

type Props = {
  colors: typeof COLORS.light;
  theme: ThemeMode;
  onBack: () => void;
  onOpenPersonalization: () => void;
  onOpenTheme: () => void;
  onOpenQuoteSettings: () => void;
  preferredCount: number;
};

const FEEDBACK_EMAIL = "abc510433622@gmail.com";
const APP_STORE_URL = "https://apps.apple.com/app/echo/id0000000000";
const PRIVACY_URL = "https://echo.app/privacy";
const TERMS_URL = "https://echo.app/terms";

const THEME_LABELS: Record<ThemeMode, string> = {
  light: "Light",
  dark: "Dark",
  archive: "Archive",
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
      "Every meaningful quote deserves another echo.\n\n" +
      "Share ECHO with someone who may need a thoughtful moment today.\n\n" +
      APP_STORE_URL;

    Alert.alert("Share ECHO", message, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Copy Link",
        onPress: () => {
          void Clipboard.setStringAsync(APP_STORE_URL);
        },
      },
    ]);
  };

  const handleSendFeedback = () => {
    const message =
      "Your thoughts help make ECHO better.\n\n" +
      "Feel free to send me your feedback, ideas, or suggestions. " +
      "Every message is read and greatly appreciated.\n\n" +
      FEEDBACK_EMAIL;

    Alert.alert("Send Feedback", message, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Copy Email",
        onPress: () => {
          void Clipboard.setStringAsync(FEEDBACK_EMAIL);
        },
      },
      {
        text: "Open Mail",
        onPress: () => {
          void safeOpenURL(
            `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(
              "ECHO App Feedback",
            )}`,
          );
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
          <Pressable style={styles.cardRow} onPress={props.onOpenTheme}>
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

          {/* Categories */}
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

              <Text
                style={[
                  styles.cardLabel,
                  {
                    color: props.colors.text,
                  },
                ]}
              >
                Categories
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
              {
                backgroundColor: props.colors.divider,
              },
            ]}
          />

          {/* Quote Settings */}
          <Pressable style={styles.cardRow} onPress={props.onOpenQuoteSettings}>
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
          <Pressable style={styles.cardRow} onPress={handleSendFeedback}>
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

          <View
            style={[
              styles.cardDivider,
              {
                backgroundColor: props.colors.divider,
              },
            ]}
          />

          <Pressable style={styles.cardRow} onPress={handleShareApp}>
            <View style={styles.cardLeft}>
              <Ionicons
                name="share-outline"
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
