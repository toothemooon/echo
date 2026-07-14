import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";

interface ActionBarProps {
  colors: (typeof COLORS)["light"];
  isSaved: boolean;
  onPrev: () => void;
  onNext: () => void;
  onBookmark: () => void;
  onShare: () => void;
  onHistory: () => void;
}

export default function ActionBar({
  colors,
  isSaved,
  onPrev,
  onNext,
  onBookmark,
  onShare,
  onHistory,
}: ActionBarProps) {
  return (
    <View style={styles.container}>
      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <Pressable
          style={[styles.actionBtn, { backgroundColor: colors.btnBg }]}
          onPress={onPrev}
        >
          <Ionicons name="chevron-back" size={20} color={colors.btnIcon} />
        </Pressable>

        <Pressable
          style={[styles.actionBtn, { backgroundColor: colors.btnBg }]}
          onPress={onBookmark}
        >
          <Ionicons
            name={isSaved ? "bookmark" : "bookmark-outline"}
            size={20}
            color={isSaved ? colors.label : colors.btnIcon}
          />
        </Pressable>

        <Pressable
          style={[styles.actionBtn, { backgroundColor: colors.btnBg }]}
          onPress={onShare}
        >
          <Ionicons name="share-outline" size={20} color={colors.btnIcon} />
        </Pressable>

        <Pressable
          style={[styles.actionBtn, { backgroundColor: colors.btnBg }]}
          onPress={onNext}
        >
          <Ionicons name="chevron-forward" size={20} color={colors.btnIcon} />
        </Pressable>
      </View>

      {/* History */}
      <Pressable style={styles.historyRow} onPress={onHistory}>
        <Text style={[styles.historyLabel, { color: colors.menuIcon }]}>
          HISTORY
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.menuIcon} />
      </Pressable>
    </View>
  );
}

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
