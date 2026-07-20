import { View, Text, Animated, StyleSheet } from "react-native";
import { COLORS } from "../../constants/colors";
import type { Quote } from "../../data/quotes";

// ══════════════════════════════════════════════
//  QuoteCard — 名言卡片展示
//  展示类别、引号、名言内容、作者和角色
//  支持 fade + slide 动画（由父组件传入 Animated.Value）
// ══════════════════════════════════════════════

// ── Props ──
type Props = {
  quote: Quote;
  colors: typeof COLORS.light;
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
};

export default function QuoteCard(props: Props) {
  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: props.fadeAnim,
          transform: [{ translateX: props.slideAnim }],
        },
      ]}
    >
      {/* Category */}
      <View style={styles.categoryRow}>
        <View
          style={[styles.categoryDot, { backgroundColor: props.colors.dot }]}
        />
        <Text style={[styles.label, { color: props.colors.label }]}>
          {props.quote.primary_category}
        </Text>
      </View>

      {/* Guillemet */}
      <Text style={[styles.guillemet, { color: props.colors.dot }]}>
        {"\u201C"}
      </Text>

      {/* Quote Text */}
      <Text style={[styles.quoteText, { color: props.colors.text }]}>
        {props.quote.text}
      </Text>

      {/* Author */}
      <Text style={[styles.author, { color: props.colors.author }]}>
        — {props.quote.author}
      </Text>

      {/* Role */}
      {props.quote.role ? (
        <Text style={[styles.role, { color: props.colors.roleText }]}>
          {props.quote.role}
        </Text>
      ) : null}
    </Animated.View>
  );
}

// ── 样式 ──
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
