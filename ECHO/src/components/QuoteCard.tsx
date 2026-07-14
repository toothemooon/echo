import { View, Text, Animated, StyleSheet } from "react-native";
import { COLORS } from "../constants/colors";
import { Quote } from "../database/quotes";

interface QuoteCardProps {
  quote: Quote;
  colors: (typeof COLORS)["light"];
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
}

export default function QuoteCard({
  quote,
  colors,
  fadeAnim,
  slideAnim,
}: QuoteCardProps) {
  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateX: slideAnim }],
        },
      ]}
    >
      {/* Category */}
      <View style={styles.categoryRow}>
        <View style={[styles.categoryDot, { backgroundColor: colors.dot }]} />
        <Text style={[styles.label, { color: colors.label }]}>
          {quote.primary_category}
        </Text>
      </View>

      {/* Guillemet */}
      <Text style={[styles.guillemet, { color: colors.dot }]}>{"\u201C"}</Text>

      {/* Quote Text */}
      <Text style={[styles.quoteText, { color: colors.text }]}>
        {quote.text}
      </Text>

      {/* Author */}
      <Text style={[styles.author, { color: colors.author }]}>
        — {quote.author}
      </Text>

      {/* Role */}
      {quote.role ? (
        <Text style={[styles.role, { color: colors.inactiveDot }]}>
          {quote.role}
        </Text>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    letterSpacing: 3,
    textTransform: "uppercase",
  },
  guillemet: {
    fontFamily: "CormorantGaramond_400Regular_Italic",
    fontSize: 64,
    lineHeight: 70,
    marginBottom: 8,
  },
  quoteText: {
    fontFamily: "CormorantGaramond_400Regular_Italic",
    fontSize: 30,
    lineHeight: 42,
    letterSpacing: 0.3,
    marginBottom: 24,
  },
  author: {
    fontSize: 16,
    fontWeight: "400",
    textAlign: "right",
  },
  role: {
    fontSize: 12,
    fontWeight: "300",
    textAlign: "right",
    marginTop: 2,
    fontStyle: "italic",
  },
});
