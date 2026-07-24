import { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  AppState,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../constants/colors";

// ══════════════════════════════════════════════
//  Header — 顶部导航栏
//  显示 TODAY + 日期，提供主题切换和菜单入口
// ══════════════════════════════════════════════

// ── Props ──
type Props = {
  colors: typeof COLORS.light;
  isDark: boolean;
  onToggleTheme: () => void;
  onMenu: () => void;
};

export default function Header(props: Props) {
  const [today, setToday] = useState(() => new Date());

  useEffect(() => {
    const refreshDate = () => setToday(new Date());
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refreshDate();
    });
    const timer = setInterval(refreshDate, 60_000);
    return () => {
      subscription.remove();
      clearInterval(timer);
    };
  }, []);

  const dayName = today.toLocaleDateString("en-US", { weekday: "long" });
  const monthDay = today.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });

  return (
    <>
      {/* 顶部行：左侧日期，右侧按钮 */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.label, { color: props.colors.label }]}>
            TODAY
          </Text>
          <Text style={[styles.date, { color: props.colors.author }]}>
            {dayName}, {monthDay}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <Pressable
            style={[styles.iconBtn, { backgroundColor: props.colors.btnBg }]}
            onPress={props.onToggleTheme}
            accessibilityRole="button"
            accessibilityLabel={props.isDark ? "Use light theme" : "Use dark theme"}
            accessibilityHint="Changes the app color theme"
          >
            <Ionicons
              name={props.isDark ? "sunny-outline" : "moon-outline"}
              size={18}
              color={props.colors.btnIcon}
            />
          </Pressable>
          <Pressable
            style={[styles.iconBtn, { backgroundColor: props.colors.btnBg }]}
            onPress={props.onMenu}
            accessibilityRole="button"
            accessibilityLabel="Open Settings"
            accessibilityHint="Opens preferences and accessibility options"
          >
            <Ionicons
              name="ellipsis-horizontal"
              size={18}
              color={props.colors.btnIcon}
            />
          </Pressable>
        </View>
      </View>
      {/* 分割线 */}
      <View
        style={[styles.divider, { backgroundColor: props.colors.divider }]}
      />
    </>
  );
}

// ── 样式 ──
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
