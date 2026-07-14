import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";

interface ThemeScreenProps {
  colors: (typeof COLORS)["light"];
  isDark: boolean;
  onToggleTheme: () => void;
  onBack: () => void;
}

const THEMES = [
  { key: "light" as const, label: "Light", icon: "sunny-outline" as const },
  { key: "dark" as const, label: "Dark", icon: "moon-outline" as const },
];

export default function ThemeScreen({
  colors,
  isDark,
  onToggleTheme,
  onBack,
}: ThemeScreenProps) {
  const currentTheme = isDark ? "dark" : "light";

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
        <Text style={[styles.headerTitle, { color: colors.text }]}>THEME</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={[styles.divider, { backgroundColor: colors.divider }]} />

      {/* Theme Options */}
      <View style={[styles.card, { backgroundColor: colors.btnBg }]}>
        {THEMES.map((theme, index) => {
          const isActive = currentTheme === theme.key;
          const isLast = index === THEMES.length - 1;
          return (
            <Pressable
              key={theme.key}
              style={[
                styles.cardRow,
                !isLast && {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: colors.divider,
                },
              ]}
              onPress={() => {
                if (theme.key === "dark" && !isDark) onToggleTheme();
                if (theme.key === "light" && isDark) onToggleTheme();
              }}
            >
              <View style={styles.cardLeft}>
                <Ionicons name={theme.icon} size={20} color={colors.btnIcon} />
                <Text style={[styles.cardLabel, { color: colors.text }]}>
                  {theme.label}
                </Text>
              </View>
              {isActive && (
                <Ionicons name="checkmark" size={20} color={colors.label} />
              )}
            </Pressable>
          );
        })}
      </View>
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
});
