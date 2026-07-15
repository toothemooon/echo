import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";

interface HeaderProps {
  colors: (typeof COLORS)["light"];
  isDark: boolean;
  onToggleTheme: () => void;
  onMenu: () => void;
}

const today = new Date();
const dayName = today.toLocaleDateString("en-US", { weekday: "long" });
const monthDay = today.toLocaleDateString("en-US", {
  month: "long",
  day: "numeric",
});

export default function Header({
  colors,
  isDark,
  onToggleTheme,
  onMenu,
}: HeaderProps) {
  return (
    <>
      <View style={styles.header}>
        <View>
          <Text style={[styles.label, { color: colors.label }]}>TODAY</Text>
          <Text style={[styles.date, { color: colors.author }]}>
            {dayName}, {monthDay}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <Pressable
            style={[styles.iconBtn, { backgroundColor: colors.btnBg }]}
            onPress={onToggleTheme}
          >
            <Ionicons
              name={isDark ? "sunny-outline" : "moon-outline"}
              size={18}
              color={colors.btnIcon}
            />
          </Pressable>
          <Pressable
            style={[styles.iconBtn, { backgroundColor: colors.btnBg }]}
            onPress={onMenu}
          >
            <Ionicons
              name="ellipsis-horizontal"
              size={18}
              color={colors.btnIcon}
            />
          </Pressable>
        </View>
      </View>
      <View style={[styles.divider, { backgroundColor: colors.divider }]} />
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerRight: {
    flexDirection: "row",
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    letterSpacing: 3,
    textTransform: "uppercase",
  },
  date: {
    fontSize: 16,
    fontWeight: "400",
    marginTop: 4,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginTop: 24,
  },
});
