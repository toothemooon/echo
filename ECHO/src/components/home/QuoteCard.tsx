import { View, Text, Animated, StyleSheet } from "react-native";
import { COLORS } from "../../constants/colors";
import type { Quote } from "../../data/quotes";
import type { QuoteFont, QuoteFontSize } from "../../storage/preferences";

type Props = {
  quote: Quote;
  colors: typeof COLORS.light;
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
  quoteFont: QuoteFont;
  quoteFontSize: QuoteFontSize;
};

const QUOTE_SIZE_STYLES: Record<
  QuoteFontSize,
  {
    fontSize: number;
    lineHeight: number;
  }
> = {
  small: {
    fontSize: 25,
    lineHeight: 36,
  },
  medium: {
    fontSize: 30,
    lineHeight: 42,
  },
  large: {
    fontSize: 36,
    lineHeight: 49,
  },
};

export default function QuoteCard(props: Props) {
  const quoteFontFamily =
    props.quoteFont === "elegant"
      ? "CormorantGaramond_400Regular_Italic"
      : undefined;

  const quoteFontStyle = props.quoteFont === "system" ? "italic" : "normal";

  const quoteSizeStyle = QUOTE_SIZE_STYLES[props.quoteFontSize];
  const normalizedRole = props.quote.role.trim();
  const displayRole =
    normalizedRole === "Writer" || normalizedRole === "Author"
      ? null
      : normalizedRole;
  const attributionDetail = props.quote.source ?? displayRole;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: props.fadeAnim,
          transform: [
            {
              translateX: props.slideAnim,
            },
          ],
        },
      ]}
    >
      {/* Category */}
      <View style={styles.categoryRow}>
        <View
          style={[
            styles.categoryDot,
            {
              backgroundColor: props.colors.dot,
            },
          ]}
        />

        <Text
          style={[
            styles.label,
            {
              color: props.colors.label,
            },
          ]}
        >
          {props.quote.primary_category}
        </Text>
      </View>

      {/* Opening quotation mark */}
      <Text
        style={[
          styles.guillemet,
          {
            color: props.colors.dot,
            fontFamily: quoteFontFamily,
          },
        ]}
      >
        {"\u201C"}
      </Text>

      {/* Quote Text */}
      <Text
        style={[
          styles.quoteText,
          quoteSizeStyle,
          {
            color: props.colors.text,
            fontFamily: quoteFontFamily,
            fontStyle: quoteFontStyle,
          },
        ]}
      >
        {props.quote.text}
      </Text>

      {/* Author */}
      <Text
        style={[
          styles.author,
          {
            color: props.colors.author,
          },
        ]}
      >
        — {props.quote.author}
      </Text>

      {/* Role */}
      {attributionDetail ? (
        <Text
          style={[
            styles.role,
            {
              color: props.colors.roleText,
            },
          ]}
        >
          {attributionDetail}
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
    fontSize: 64,
    lineHeight: 70,
    marginBottom: 8,
  },
  quoteText: {
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
