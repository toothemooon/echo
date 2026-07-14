import { useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { StatusBar } from "expo-status-bar";
import {
  useFonts,
  CormorantGaramond_400Regular_Italic,
} from "@expo-google-fonts/cormorant-garamond";
import { Ionicons } from "@expo/vector-icons";

const QUOTE = {
  text: "The present moment is the only moment available to us, and it is the door to all moments.",
  author: "Thich Nhat Hanh",
  category: "MINDFULNESS",
};

const COLORS = {
  light: {
    background: "#E5E0D8",
    text: "#2C2A26",
    author: "#9A9690",
    label: "#8FAE8B",
    dot: "#8FAE8B",
    inactiveDot: "#D0CECC",
    divider: "#D5D2CC",
    btnBg: "#DDD9D4",
    btnIcon: "#8A8680",
    menuIcon: "#9A9690",
  },
  dark: {
    background: "#1A1A18",
    text: "#E8E6E2",
    author: "#7A7874",
    label: "#8FAE8B",
    dot: "#8FAE8B",
    inactiveDot: "#3A3A38",
    divider: "#333230",
    btnBg: "#2A2A28",
    btnIcon: "#8A8884",
    menuIcon: "#7A7874",
  },
};

export default function App() {
  const [isDark, setIsDark] = useState(false);
  const [fontsLoaded] = useFonts({
    CormorantGaramond_400Regular_Italic,
  });

  useEffect(() => {
    const colorScheme = require("react-native").Appearance?.getColorScheme();
    if (colorScheme === "dark") setIsDark(true);
  }, []);

  if (!fontsLoaded) return null;

  const c = isDark ? COLORS.dark : COLORS.light;
  const statusBar = isDark ? "light" : "dark";

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <StatusBar style={statusBar} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.label, { color: c.label }]}>TODAY</Text>
          <Text style={[styles.date, { color: c.author }]}>
            Tuesday, July 14
          </Text>
        </View>
        <View style={styles.headerRight}>
          <Pressable
            style={[styles.iconBtn, { backgroundColor: c.btnBg }]}
            onPress={() => setIsDark(!isDark)}
          >
            <Ionicons
              name={isDark ? "sunny-outline" : "moon-outline"}
              size={18}
              color={c.btnIcon}
            />
          </Pressable>
          <Pressable style={[styles.iconBtn, { backgroundColor: c.btnBg }]}>
            <Ionicons name="ellipsis-horizontal" size={18} color={c.btnIcon} />
          </Pressable>
        </View>
      </View>

      {/* ── Divider ── */}
      <View style={[styles.divider, { backgroundColor: c.divider }]} />

      {/* ── Quote Section ── */}
      <View style={styles.quoteSection}>
        {/* Category */}
        <View style={styles.categoryRow}>
          <View style={[styles.categoryDot, { backgroundColor: c.dot }]} />
          <Text style={[styles.label, { color: c.label, fontSize: 13 }]}>
            {QUOTE.category}
          </Text>
        </View>

        {/* Guillemet */}
        <Text style={[styles.guillemet, { color: c.dot }]}>{"\u201C"}</Text>

        {/* Quote Text */}
        <Text style={[styles.quoteText, { color: c.text }]}>{QUOTE.text}</Text>

        {/* Author */}
        <Text style={[styles.author, { color: c.author }]}>
          — {QUOTE.author}
        </Text>
      </View>

      {/* ── Bottom Section ── */}
      <View style={styles.bottomSection}>
        {/* Pagination Dots */}
        <View style={styles.dotsRow}>
          {[0, 1, 2, 3, 4].map((i) => (
            <View
              key={i}
              style={[
                i === 0 ? styles.dotActive : styles.dotInactive,
                { backgroundColor: i === 0 ? c.dot : c.inactiveDot },
              ]}
            />
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <Pressable style={[styles.actionBtn, { backgroundColor: c.btnBg }]}>
            <Ionicons name="chevron-back" size={20} color={c.btnIcon} />
          </Pressable>
          <Pressable style={[styles.actionBtn, { backgroundColor: c.btnBg }]}>
            <Ionicons name="bookmark-outline" size={20} color={c.btnIcon} />
          </Pressable>
          <Pressable style={[styles.actionBtn, { backgroundColor: c.btnBg }]}>
            <Ionicons name="share-outline" size={20} color={c.btnIcon} />
          </Pressable>
          <Pressable style={[styles.actionBtn, { backgroundColor: c.btnBg }]}>
            <Ionicons name="chevron-forward" size={20} color={c.btnIcon} />
          </Pressable>
        </View>

        {/* History */}
        <View style={styles.historyRow}>
          <Text style={[styles.label, { color: c.menuIcon, fontSize: 12 }]}>
            HISTORY
          </Text>
          <Ionicons name="chevron-down" size={16} color={c.menuIcon} />
        </View>
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
  quoteSection: {
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
  guillemet: {
    fontFamily: "CormorantGaramond_400Regular_Italic",
    fontSize: 64,
    lineHeight: 70,
    marginBottom: 8,
  },
  quoteText: {
    fontFamily: "CormorantGaramond_400Regular_Italic",
    fontSize: 30,
    lineHeight: 42,
    letterSpacing: 0.3,
    marginBottom: 24,
  },
  author: {
    fontSize: 16,
    fontWeight: "400",
    textAlign: "right",
  },
  bottomSection: {
    alignItems: "center",
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },
  dotActive: {
    width: 24,
    height: 8,
    borderRadius: 4,
  },
  dotInactive: {
    width: 8,
    height: 8,
    borderRadius: 4,
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
});
