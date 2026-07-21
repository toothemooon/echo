import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";
import type { ThemeMode } from "../storage/preferences";

// ══════════════════════════════════════════════
//  ThemeScreen — 主题选择器
//  提供 Light / Dark / Archive 三个选项，切换后立即生效
// ══════════════════════════════════════════════

// ── Props ──
type Props = {
  colors: typeof COLORS.light;
  theme: ThemeMode;
  onChangeTheme: (theme: ThemeMode) => void;
  onBack: () => void;
};

const THEMES = [
  { key: "light" as const, label: "Light", icon: "sunny-outline" as const },
  { key: "dark" as const, label: "Dark", icon: "moon-outline" as const },
  {
    key: "archive" as const,
    label: "Archive",
    icon: "library-outline" as const,
  },
];

export default function ThemeScreen(props: Props) {
  return (
    <View
      style={[styles.container, { backgroundColor: props.colors.background }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={[styles.backBtn, { backgroundColor: props.colors.btnBg }]}
          onPress={props.onBack}
        >
          <Ionicons
            name="chevron-back"
            size={20}
            color={props.colors.btnIcon}
          />
        </Pressable>
        <Text style={[styles.headerTitle, { color: props.colors.text }]}>
          THEME
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <View
        style={[styles.divider, { backgroundColor: props.colors.divider }]}
      />

      {/* Theme Options */}
      <View style={[styles.card, { backgroundColor: props.colors.btnBg }]}>
        {THEMES.map((theme, index) => {
          const isActive = props.theme === theme.key;
          const isLast = index === THEMES.length - 1;
          return (
            <Pressable
              key={theme.key}
              style={[
                styles.cardRow,
                !isLast && {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: props.colors.divider,
                },
              ]}
              onPress={() => props.onChangeTheme(theme.key)}
            >
              <View style={styles.cardLeft}>
                <Ionicons
                  name={theme.icon}
                  size={20}
                  color={props.colors.btnIcon}
                />
                <Text style={[styles.cardLabel, { color: props.colors.text }]}>
                  {theme.label}
                </Text>
              </View>
              {isActive && (
                <Ionicons
                  name="checkmark"
                  size={20}
                  color={props.colors.label}
                />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ── 样式 ──
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
