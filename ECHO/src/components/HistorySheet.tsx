import {
  View,
  Text,
  Pressable,
  Animated,
  StyleSheet,
  Dimensions,
} from "react-native";
import { COLORS } from "../constants/colors";
import { Quote } from "../data/quotes";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface HistorySheetProps {
  visible: boolean;
  savedQuotes: Quote[];
  colors: (typeof COLORS)["light"];
  sheetAnim: Animated.Value;
  backdropAnim: Animated.Value;
  onClose: () => void;
}

export default function HistorySheet({
  visible,
  savedQuotes,
  colors,
  sheetAnim,
  backdropAnim,
  onClose,
}: HistorySheetProps) {
  if (!visible) return null;

  return (
    <>
      {/* Backdrop */}
      <Animated.View
        style={[
          styles.backdrop,
          {
            opacity: backdropAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.4],
            }),
          },
        ]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          {
            backgroundColor: colors.sheetBg,
            transform: [{ translateY: sheetAnim }],
          },
        ]}
      >
        {/* Handle */}
        <View style={styles.handleContainer}>
          <View
            style={[styles.handle, { backgroundColor: colors.sheetHandle }]}
          />
        </View>

        {/* Sheet Header */}
        <View style={styles.sheetHeader}>
          <Text
            style={[
              styles.sheetTitle,
              {
                color: colors.sheetTitle,
                fontFamily: "CormorantGaramond_400Regular_Italic",
              },
            ]}
          >
            Saved Quotes
          </Text>
          <Pressable onPress={onClose}>
            <Text style={[styles.doneBtn, { color: colors.label }]}>Done</Text>
          </Pressable>
        </View>

        {/* Divider */}
        <View
          style={[styles.sheetDivider, { backgroundColor: colors.divider }]}
        />

        {/* Content */}
        {savedQuotes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text
              style={[
                styles.emptyText,
                {
                  color: colors.sheetEmpty,
                  fontFamily: "CormorantGaramond_400Regular_Italic",
                },
              ]}
            >
              No saved quotes yet.
            </Text>
            <Text
              style={[
                styles.emptyText,
                {
                  color: colors.sheetEmpty,
                  fontFamily: "CormorantGaramond_400Regular_Italic",
                },
              ]}
            >
              Bookmark ones that speak to you.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {savedQuotes.map((q) => (
              <View key={q.id} style={styles.savedItem}>
                <Text
                  style={[
                    styles.savedText,
                    {
                      color: colors.text,
                      fontFamily: "CormorantGaramond_400Regular_Italic",
                    },
                  ]}
                >
                  "{q.text}"
                </Text>
                <Text style={[styles.savedAuthor, { color: colors.author }]}>
                  — {q.author}
                </Text>
              </View>
            ))}
          </View>
        )}
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "#000",
    zIndex: 10,
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: SCREEN_HEIGHT * 0.7,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    zIndex: 20,
    paddingBottom: 40,
  },
  handleContainer: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 6,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  sheetTitle: {
    fontSize: 26,
    fontWeight: "700",
  },
  doneBtn: {
    fontSize: 16,
    fontWeight: "600",
  },
  sheetDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 24,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  emptyText: {
    fontSize: 18,
    fontStyle: "italic",
    textAlign: "center",
  },
  list: {
    flex: 1,
    paddingTop: 20,
    paddingHorizontal: 24,
  },
  savedItem: {
    marginBottom: 24,
  },
  savedText: {
    fontSize: 20,
    lineHeight: 28,
    fontStyle: "italic",
    marginBottom: 6,
  },
  savedAuthor: {
    fontSize: 14,
    textAlign: "right",
  },
});
