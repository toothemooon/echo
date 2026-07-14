import { View, Text, StyleSheet, Dimensions } from "react-native";
import { COLORS } from "../constants/colors";
import { Quote } from "../database/quotes";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH - 64;
const CARD_HEIGHT = 400;

interface ShareCardProps {
  quote: Quote;
  colors: (typeof COLORS)["light"];
}

/**
 * A styled quote card for image capture via react-native-view-shot.
 * Not rendered in the main UI — used offscreen for screenshot generation.
 */
export default function ShareCard({ quote, colors }: ShareCardProps) {
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.background,
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
        },
      ]}
    >
      {/* Category */}
      <View style={styles.categoryRow}>
        <View style={[styles.dot, { backgroundColor: colors.dot }]} />
        <Text style={[styles.category, { color: colors.label }]}>
          {quote.primary_category}
        </Text>
      </View>

      {/* Guillemet */}
      <Text style={[styles.guillemet, { color: colors.dot }]}>{"\u201C"}</Text>

      {/* Quote */}
      <Text style={[styles.quoteText, { color: colors.text }]}>
        {quote.text}
      </Text>

      {/* Author */}
      <Text style={[styles.author, { color: colors.author }]}>
        — {quote.author}
      </Text>

      {/* App branding */}
      <Text style={[styles.branding, { color: colors.inactiveDot }]}>
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
    fontFamily: "CormorantGaramond_400Regular_Italic",
    fontSize: 22,
    lineHeight: 32,
    letterSpacing: 0.3,
    marginBottom: 20,
  },
  author: {
    fontSize: 14,
    fontWeight: "400",
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
