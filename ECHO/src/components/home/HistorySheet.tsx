import {
  View,
  Text,
  Pressable,
  Animated,
  StyleSheet,
  Dimensions,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../constants/colors";
import type { Quote } from "../../data/quotes";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

// ══════════════════════════════════════════════
//  HistorySheet — 收藏名言底部弹窗
//  Spring 物理动画弹窗，展示已收藏的名言列表
//  支持删除操作
// ══════════════════════════════════════════════

// ── Props ──
type Props = {
  visible: boolean;
  savedQuotes: Quote[];
  colors: typeof COLORS.light;
  sheetAnim: Animated.Value;
  backdropAnim: Animated.Value;
  onClose: () => void;
  onRemove: (quoteId: Quote["id"]) => void;
};

export default function HistorySheet(props: Props) {
  // ── 未显示时直接返回 ──
  if (!props.visible) return null;

  return (
    <>
      {/* Backdrop */}
      <Animated.View
        style={[
          styles.backdrop,
          {
            opacity: props.backdropAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.4],
            }),
          },
        ]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={props.onClose} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          {
            backgroundColor: props.colors.sheetBg,
            transform: [{ translateY: props.sheetAnim }],
          },
        ]}
      >
        {/* Handle */}
        <View style={styles.handleContainer}>
          <View
            style={[
              styles.handle,
              { backgroundColor: props.colors.sheetHandle },
            ]}
          />
        </View>

        {/* Sheet Header */}
        <View style={styles.sheetHeader}>
          <Text
            style={[
              styles.sheetTitle,
              {
                color: props.colors.sheetTitle,
                fontFamily: "CormorantGaramond_400Regular_Italic",
              },
            ]}
          >
            Saved Quotes
          </Text>
          <Pressable onPress={props.onClose}>
            <Text style={[styles.doneBtn, { color: props.colors.label }]}>
              Done
            </Text>
          </Pressable>
        </View>

        {/* Divider */}
        <View
          style={[
            styles.sheetDivider,
            { backgroundColor: props.colors.divider },
          ]}
        />

        {/* Content */}
        {props.savedQuotes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text
              style={[
                styles.emptyText,
                {
                  color: props.colors.sheetEmpty,
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
                  color: props.colors.sheetEmpty,
                  fontFamily: "CormorantGaramond_400Regular_Italic",
                },
              ]}
            >
              Bookmark ones that speak to you.
            </Text>
          </View>
        ) : (
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {props.savedQuotes.map((q) => (
              <View
                key={q.id}
                style={[
                  styles.savedItem,
                  { backgroundColor: props.colors.btnBg },
                ]}
              >
                {/* Delete button */}
                <Pressable
                  style={styles.deleteBtn}
                  onPress={() => props.onRemove(q.id)}
                >
                  <Ionicons
                    name="close-circle"
                    size={20}
                    color={props.colors.menuIcon}
                  />
                </Pressable>

                <Text
                  style={[
                    styles.savedText,
                    {
                      color: props.colors.text,
                      fontFamily: "CormorantGaramond_400Regular_Italic",
                    },
                  ]}
                >
                  "{q.text}"
                </Text>
                <Text
                  style={[styles.savedAuthor, { color: props.colors.author }]}
                >
                  — {q.author}
                </Text>
              </View>
            ))}
          </ScrollView>
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
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    position: "relative",
  },
  deleteBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 1,
  },
  savedText: {
    fontSize: 20,
    lineHeight: 28,
    fontStyle: "italic",
    marginBottom: 6,
    paddingRight: 28,
  },
  savedAuthor: {
    fontSize: 14,
    textAlign: "right",
  },
});
