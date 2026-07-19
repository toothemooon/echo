import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../constants/colors";

// ══════════════════════════════════════════════
//  ActionBar — 操作按钮栏
//  提供前进/后退、收藏、分享、历史记录入口
// ══════════════════════════════════════════════

// ── Props ──
type Props = {
  colors: (typeof COLORS)["light"];
  isSaved: boolean;
  onPrev?: () => void;
  onNext: () => void;
  onBookmark: () => void;
  onShare: () => void;
  onHistory: () => void;
};

export default function ActionBar(props: Props) {
  return (
    <View style={styles.container}>
      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <Pressable
          style={[
            styles.actionBtn,
            {
              backgroundColor: props.colors.btnBg,
              opacity: props.onPrev ? 1 : 0.4,
            },
          ]}
          onPress={props.onPrev ?? (() => {})}
        >
          <Ionicons
            name="chevron-back"
            size={20}
            color={props.colors.btnIcon}
          />
        </Pressable>

        <Pressable
          style={[styles.actionBtn, { backgroundColor: props.colors.btnBg }]}
          onPress={props.onBookmark}
        >
          <Ionicons
            name={props.isSaved ? "bookmark" : "bookmark-outline"}
            size={20}
            color={props.isSaved ? props.colors.label : props.colors.btnIcon}
          />
        </Pressable>

        <Pressable
          style={[styles.actionBtn, { backgroundColor: props.colors.btnBg }]}
          onPress={props.onShare}
        >
          <Ionicons
            name="share-outline"
            size={20}
            color={props.colors.btnIcon}
          />
        </Pressable>

        <Pressable
          style={[styles.actionBtn, { backgroundColor: props.colors.btnBg }]}
          onPress={props.onNext}
        >
          <Ionicons
            name="chevron-forward"
            size={20}
            color={props.colors.btnIcon}
          />
        </Pressable>
      </View>

      {/* History */}
      <Pressable style={styles.historyRow} onPress={props.onHistory}>
        <Text style={[styles.historyLabel, { color: props.colors.menuIcon }]}>
          HISTORY
        </Text>
        <Ionicons name="chevron-down" size={16} color={props.colors.menuIcon} />
      </Pressable>
    </View>
  );
}

// ── 样式 ──
const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    marginBottom: 24,
  },
  actionBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  historyRow: {
    alignItems: "center",
    gap: 2,
  },
  historyLabel: {
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 3,
    textTransform: "uppercase",
  },
});
