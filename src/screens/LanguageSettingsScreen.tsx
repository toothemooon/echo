import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";
import ArchiveBackground from "../components/common/ArchiveBackground";
import type {
  QuoteLanguagePreference,
  ThemeMode,
} from "../storage/preferences";

type Props = {
  colors: typeof COLORS.light;
  theme: ThemeMode;
  language: QuoteLanguagePreference;
  onChangeLanguage: (language: QuoteLanguagePreference) => void;
  onBack: () => void;
};

const OPTIONS: Array<{
  value: QuoteLanguagePreference;
  label: string;
  description: string;
}> = [
  {
    value: "en",
    label: "English",
    description: "Show English quotes",
  },
  {
    value: "zh-Hans",
    label: "简体中文",
    description: "显示简体中文格言",
  },
  {
    value: "ja",
    label: "日本語",
    description: "日本語の格言を表示",
  },
];

export default function LanguageSettingsScreen(props: Props) {
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
          accessibilityLabel="Back to Settings"
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
          LANGUAGE
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

      <Text
        style={[
          styles.sectionTitle,
          {
            color: props.colors.label,
          },
        ]}
      >
        QUOTE LANGUAGE
      </Text>

      <View
        style={[
          styles.card,
          {
            backgroundColor: props.colors.btnBg,
          },
        ]}
      >
        {OPTIONS.map((option, index) => {
          const selected = props.language === option.value;

          return (
            <View key={option.value}>
              <Pressable
                style={styles.cardRow}
                onPress={() => props.onChangeLanguage(option.value)}
                accessibilityRole="radio"
                accessibilityLabel={option.label}
                accessibilityHint={option.description}
                accessibilityState={{ checked: selected }}
              >
                <View style={styles.cardLeft}>
                  <Ionicons
                    name="language-outline"
                    size={20}
                    color={props.colors.btnIcon}
                  />

                  <View>
                    <Text
                      style={[
                        styles.cardLabel,
                        {
                          color: props.colors.text,
                        },
                      ]}
                    >
                      {option.label}
                    </Text>

                    <Text
                      style={[
                        styles.description,
                        {
                          color: props.colors.author,
                        },
                      ]}
                    >
                      {option.description}
                    </Text>
                  </View>
                </View>

                <Ionicons
                  name={
                    selected
                      ? "checkmark-circle"
                      : "ellipse-outline"
                  }
                  size={22}
                  color={
                    selected
                      ? props.colors.dot
                      : props.colors.inactiveDot
                  }
                />
              </Pressable>

              {index < OPTIONS.length - 1 ? (
                <View
                  style={[
                    styles.cardDivider,
                    {
                      backgroundColor: props.colors.divider,
                    },
                  ]}
                />
              ) : null}
            </View>
          );
        })}
      </View>
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
    marginBottom: 14,
  },
  card: {
    borderRadius: 16,
    paddingHorizontal: 20,
  },
  cardRow: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardLabel: {
    fontSize: 16,
  },
  description: {
    fontSize: 12,
    marginTop: 3,
  },
  cardDivider: {
    height: StyleSheet.hairlineWidth,
  },
});
