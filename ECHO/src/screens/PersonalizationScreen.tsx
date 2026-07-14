import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";
import { CATEGORIES, CATEGORY_COLORS, Category } from "../constants/categories";

interface PersonalizationScreenProps {
  colors: (typeof COLORS)["light"];
  preferredCategories: Category[];
  onToggleCategory: (category: Category) => void;
  onBack: () => void;
}

export default function PersonalizationScreen({
  colors,
  preferredCategories,
  onToggleCategory,
  onBack,
}: PersonalizationScreenProps) {
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={[styles.backBtn, { backgroundColor: colors.btnBg }]}
          onPress={onBack}
        >
          <Ionicons name="chevron-back" size={20} color={colors.btnIcon} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          PERSONALIZATION
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={[styles.divider, { backgroundColor: colors.divider }]} />

      {/* Category List */}
      <View style={[styles.card, { backgroundColor: colors.btnBg }]}>
        {CATEGORIES.map((cat, index) => {
          const isActive = preferredCategories.includes(cat);
          const catColor = CATEGORY_COLORS[cat];
          const isLast = index === CATEGORIES.length - 1;
          return (
            <Pressable
              key={cat}
              style={[
                styles.cardRow,
                !isLast && {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: colors.divider,
                },
              ]}
              onPress={() => onToggleCategory(cat)}
            >
              <View style={styles.cardLeft}>
                <View
                  style={[styles.categoryDot, { backgroundColor: catColor }]}
                />
                <Text style={[styles.cardLabel, { color: colors.text }]}>
                  {cat.charAt(0) + cat.slice(1).toLowerCase()}
                </Text>
              </View>
              <View
                style={[
                  styles.checkbox,
                  {
                    borderColor: isActive ? catColor : colors.inactiveDot,
                    backgroundColor: isActive ? catColor : "transparent",
                  },
                ]}
              >
                {isActive && (
                  <Ionicons name="checkmark" size={14} color="#fff" />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Hint */}
      <Text style={[styles.hint, { color: colors.inactiveDot }]}>
        Daily quotes will be mixed from your selected categories.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: "500",
    letterSpacing: 3,
    textTransform: "uppercase",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginTop: 24,
    marginBottom: 32,
  },
  card: {
    borderRadius: 16,
    paddingHorizontal: 20,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: "400",
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  hint: {
    fontSize: 13,
    marginTop: 16,
    fontStyle: "italic",
  },
});
