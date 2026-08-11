import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";
import type { QuoteFont, QuoteFontSize } from "../storage/preferences";
import type { ThemeMode } from "../storage/preferences";
import ArchiveBackground from "../components/common/ArchiveBackground";

type Props = {
  colors: typeof COLORS.light;
  theme: ThemeMode;
  quoteFont: QuoteFont;
  quoteFontSize: QuoteFontSize;
  onChangeQuoteFont: (font: QuoteFont) => void;
  onChangeQuoteFontSize: (size: QuoteFontSize) => void;
  onBack: () => void;
};

const FONT_OPTIONS: Array<{ label: string; value: QuoteFont }> = [
  { label: "Elegant", value: "elegant" },
  { label: "System", value: "system" },
];

const SIZE_OPTIONS: Array<{ label: string; value: QuoteFontSize }> = [
  { label: "Small", value: "small" },
  { label: "Medium", value: "medium" },
  { label: "Large", value: "large" },
];

export default function QuoteSettingsScreen(props: Props) {
  return (
    <View
      style={[styles.container, { backgroundColor: props.colors.background }]}
    >
      <ArchiveBackground theme={props.theme} />
      <View style={styles.header}>
        <Pressable
          style={[styles.backBtn, { backgroundColor: props.colors.btnBg }]}
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

        <Text style={[styles.headerTitle, { color: props.colors.text }]}>
          QUOTE SETTINGS
        </Text>

        <View style={styles.headerPlaceholder} />
      </View>

      <View
        style={[styles.divider, { backgroundColor: props.colors.divider }]}
      />

      <Text style={[styles.sectionTitle, { color: props.colors.label }]}>
        FONT
      </Text>

      <View style={[styles.card, { backgroundColor: props.colors.btnBg }]}>
        {FONT_OPTIONS.map((option, index) => {
          const selected = props.quoteFont === option.value;

          return (
            <View key={option.value}>
              <Pressable
                style={styles.cardRow}
                onPress={() => props.onChangeQuoteFont(option.value)}
                accessibilityRole="radio"
                accessibilityLabel={`${option.label} font`}
                accessibilityState={{ checked: selected }}
              >
                <View style={styles.cardLeft}>
                  <Ionicons
                    name={
                      option.value === "elegant"
                        ? "book-outline"
                        : "text-outline"
                    }
                    size={20}
                    color={props.colors.btnIcon}
                  />
                  <Text
                    style={[
                      styles.cardLabel,
                      { color: props.colors.text },
                      option.value === "elegant" && styles.elegantPreview,
                    ]}
                  >
                    {option.label}
                  </Text>
                </View>

                <Ionicons
                  name={selected ? "checkmark-circle" : "ellipse-outline"}
                  size={22}
                  color={
                    selected ? props.colors.dot : props.colors.inactiveDot
                  }
                />
              </Pressable>

              {index < FONT_OPTIONS.length - 1 ? (
                <View
                  style={[
                    styles.cardDivider,
                    { backgroundColor: props.colors.divider },
                  ]}
                />
              ) : null}
            </View>
          );
        })}
      </View>

      <Text style={[styles.sectionTitle, { color: props.colors.label }]}>
        SIZE
      </Text>

      <View style={[styles.card, { backgroundColor: props.colors.btnBg }]}>
        {SIZE_OPTIONS.map((option, index) => {
          const selected = props.quoteFontSize === option.value;

          return (
            <View key={option.value}>
              <Pressable
                style={styles.cardRow}
                onPress={() => props.onChangeQuoteFontSize(option.value)}
                accessibilityRole="radio"
                accessibilityLabel={`${option.label} text size`}
                accessibilityState={{ checked: selected }}
              >
                <View style={styles.cardLeft}>
                  <Ionicons
                    name="resize-outline"
                    size={20}
                    color={props.colors.btnIcon}
                  />
                  <Text style={[styles.cardLabel, { color: props.colors.text }]}>
                    {option.label}
                  </Text>
                </View>

                <Ionicons
                  name={selected ? "checkmark-circle" : "ellipse-outline"}
                  size={22}
                  color={
                    selected ? props.colors.dot : props.colors.inactiveDot
                  }
                />
              </Pressable>

              {index < SIZE_OPTIONS.length - 1 ? (
                <View
                  style={[
                    styles.cardDivider,
                    { backgroundColor: props.colors.divider },
                  ]}
                />
              ) : null}
            </View>
          );
        })}
      </View>

      <Text style={[styles.previewLabel, { color: props.colors.label }]}>
        PREVIEW
      </Text>
      <Text
        style={[
          styles.preview,
          {
            color: props.colors.text,
            fontFamily:
              props.quoteFont === "elegant"
                ? "CormorantGaramond_400Regular_Italic"
                : undefined,
            fontStyle: props.quoteFont === "system" ? "italic" : "normal",
            fontSize:
              props.quoteFontSize === "small"
                ? 22
                : props.quoteFontSize === "large"
                  ? 32
                  : 27,
          },
        ]}
      >
        Let your inner voice echo clearly.
      </Text>
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
    marginBottom: 12,
  },
  card: {
    borderRadius: 16,
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  cardRow: {
    minHeight: 58,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardLabel: {
    fontSize: 16,
  },
  elegantPreview: {
    fontFamily: "CormorantGaramond_400Regular_Italic",
    fontSize: 20,
  },
  cardDivider: {
    height: StyleSheet.hairlineWidth,
  },
  previewLabel: {
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 3,
    marginTop: 4,
    marginBottom: 12,
  },
  preview: {
    lineHeight: 40,
  },
});
