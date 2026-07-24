import { View, Text, StyleSheet, useWindowDimensions } from "react-native";
import { COLORS } from "../../constants/colors";
import type { Quote } from "../../data/quotes";

const CARD_HEIGHT = 400;

// ══════════════════════════════════════════════
//  ShareCard — 离屏分享卡片
//  不在 UI 中显示，用于 react-native-view-shot 截图
//  截图后生成分享图片
// ══════════════════════════════════════════════

// ── Props ──
type Props = {
  quote: Quote;
  colors: typeof COLORS.light;
};

/**
 * A styled quote card for image capture via react-native-view-shot.
 * Not rendered in the main UI — used offscreen for screenshot generation.
 */
export default function ShareCard(props: Props) {
  const { width } = useWindowDimensions();
  const cardWidth = Math.max(240, width - 64);
  const textLength = props.quote.text.length;
  const quoteFontSize =
    textLength > 260 ? 15 : textLength > 190 ? 17 : textLength > 120 ? 19 : 22;
  const normalizedRole = props.quote.role.trim();
  const displayRole =
    normalizedRole === "Writer" || normalizedRole === "Author"
      ? null
      : normalizedRole;
  const attributionDetail = props.quote.source ?? displayRole;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: props.colors.background,
          width: cardWidth,
          height: CARD_HEIGHT,
        },
      ]}
    >
      {/* Category */}
      <View style={styles.categoryRow}>
        <View style={[styles.dot, { backgroundColor: props.colors.dot }]} />
        <Text style={[styles.category, { color: props.colors.label }]}>
          {props.quote.primary_category}
        </Text>
      </View>

      {/* Guillemet */}
      <Text style={[styles.guillemet, { color: props.colors.dot }]}>
        {"\u201C"}
      </Text>

      {/* Quote */}
      <Text
        style={[
          styles.quoteText,
          {
            color: props.colors.text,
            fontFamily:
              props.quote.language !== "en"
                ? undefined
                : "CormorantGaramond_400Regular_Italic",
            fontStyle:
              props.quote.language !== "en" ? "normal" : "italic",
            fontSize: quoteFontSize,
            lineHeight: Math.round(quoteFontSize * 1.45),
          },
        ]}
      >
        {props.quote.text}
      </Text>

      {/* Author */}
      <Text style={[styles.author, { color: props.colors.author }]}>
        — {props.quote.author}
      </Text>

      {attributionDetail ? (
        <Text
          style={[styles.role, { color: props.colors.roleText }]}
          numberOfLines={2}
          adjustsFontSizeToFit
        >
          {attributionDetail}
        </Text>
      ) : null}

      {/* App branding */}
      <Text style={[styles.branding, { color: props.colors.inactiveDot }]}>
        Echo · Daily Quotes
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 32,
    justifyContent: "center",
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  category: {
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 3,
    textTransform: "uppercase",
  },
  guillemet: {
    fontFamily: "CormorantGaramond_400Regular_Italic",
    fontSize: 48,
    lineHeight: 52,
    marginBottom: 4,
  },
  quoteText: {
    letterSpacing: 0.3,
    marginBottom: 20,
  },
  author: {
    fontSize: 14,
    fontWeight: "400",
    textAlign: "right",
    marginBottom: 4,
  },
  role: {
    fontSize: 11,
    fontWeight: "300",
    fontStyle: "italic",
    textAlign: "right",
    marginBottom: 4,
  },
  branding: {
    fontSize: 10,
    fontWeight: "400",
    textAlign: "right",
    letterSpacing: 1,
  },
});
