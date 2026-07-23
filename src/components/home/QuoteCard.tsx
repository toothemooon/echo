import {
  View,
  Text,
  Pressable,
  Animated,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from "react-native";
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
  onPressAuthor?: () => void;
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
  const { height } = useWindowDimensions();
  const usesSystemCjkFont = props.quote.language !== "en";
  const quoteFontFamily =
    !usesSystemCjkFont && props.quoteFont === "elegant"
      ? "CormorantGaramond_400Regular_Italic"
      : undefined;

  const quoteFontStyle =
    !usesSystemCjkFont && props.quoteFont === "system" ? "italic" : "normal";

  const quoteSizeStyle = QUOTE_SIZE_STYLES[props.quoteFontSize];
  const lengthScale =
    props.quote.text.length > 280
      ? 0.64
      : props.quote.text.length > 220
        ? 0.72
        : props.quote.text.length > 160
          ? 0.8
          : props.quote.text.length > 110
            ? 0.9
            : 1;
  const screenScale = height < 700 ? 0.88 : 1;
  const adaptiveFontSize = Math.max(
    18,
    Math.round(quoteSizeStyle.fontSize * lengthScale * screenScale),
  );
  const adaptiveLineHeight = Math.round(adaptiveFontSize * 1.38);
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
      <ScrollView
        style={{ maxHeight: Math.max(190, height * 0.42) }}
        contentContainerStyle={styles.quoteScrollContent}
        showsVerticalScrollIndicator={props.quote.text.length > 220}
      >
        <Text
          style={[
            styles.quoteText,
            {
              color: props.colors.text,
              fontFamily: quoteFontFamily,
              fontStyle: quoteFontStyle,
              fontSize: adaptiveFontSize,
              lineHeight: adaptiveLineHeight,
            },
          ]}
        >
          {props.quote.text}
        </Text>
      </ScrollView>

      {/* Author */}
      <Pressable
        onPress={props.onPressAuthor}
        disabled={!props.onPressAuthor}
        accessibilityRole="button"
        accessibilityLabel={`Learn more about ${props.quote.author}`}
        hitSlop={10}
      >
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
      </Pressable>

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
  },
  quoteScrollContent: {
    paddingBottom: 24,
  },
  author: {
    fontSize: 16,
    fontWeight: "400",
    textAlign: "right",
    textDecorationLine: "underline",
    textDecorationStyle: "solid",
  },
  role: {
    fontSize: 12,
    fontWeight: "300",
    textAlign: "right",
    marginTop: 2,
    fontStyle: "italic",
  },
});
