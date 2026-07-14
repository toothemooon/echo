import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Alert,
  Dimensions,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import {
  useFonts,
  CormorantGaramond_400Regular_Italic,
} from "@expo-google-fonts/cormorant-garamond";
import { Ionicons } from "@expo/vector-icons";
import { QUOTES, Quote } from "./src/data/quotes";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

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
    sheetBg: "#EAE6DF",
    sheetHandle: "#D0CECC",
    sheetTitle: "#2C2A26",
    sheetEmpty: "#B5B0AA",
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
    sheetBg: "#252523",
    sheetHandle: "#3A3A38",
    sheetTitle: "#E8E6E2",
    sheetEmpty: "#5A5854",
  },
};

export default function App() {
  const [isDark, setIsDark] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [savedQuotes, setSavedQuotes] = useState<Quote[]>([]);
  const [historyVisible, setHistoryVisible] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const sheetAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

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
  const currentQuote = QUOTES[currentIndex];
  const isSaved = savedQuotes.some((q) => q.id === currentQuote.id);

  // ── Quote Transition Animation ──
  const animateQuote = (direction: "left" | "right") => {
    const toSlide = direction === "left" ? -60 : 60;

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: toSlide,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Update index
      setCurrentIndex((prev) => {
        if (direction === "right") {
          return prev < QUOTES.length - 1 ? prev + 1 : 0;
        } else {
          return prev > 0 ? prev - 1 : QUOTES.length - 1;
        }
      });

      // Reset position to opposite side
      slideAnim.setValue(-toSlide);
      fadeAnim.setValue(0);

      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const goNext = () => animateQuote("right");
  const goPrev = () => animateQuote("left");

  // ── Bookmark ──
  const toggleBookmark = () => {
    if (isSaved) {
      setSavedQuotes((prev) => prev.filter((q) => q.id !== currentQuote.id));
    } else {
      setSavedQuotes((prev) => [...prev, currentQuote]);
    }
  };

  // ── History Sheet ──
  const openHistory = () => {
    setHistoryVisible(true);
    Animated.parallel([
      Animated.spring(sheetAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 18,
        stiffness: 120,
      }),
      Animated.timing(backdropAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeHistory = () => {
    Animated.parallel([
      Animated.spring(sheetAnim, {
        toValue: SCREEN_HEIGHT,
        useNativeDriver: true,
        damping: 18,
        stiffness: 120,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => setHistoryVisible(false));
  };

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
      <Animated.View
        style={[
          styles.quoteSection,
          {
            opacity: fadeAnim,
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        {/* Category */}
        <View style={styles.categoryRow}>
          <View style={[styles.categoryDot, { backgroundColor: c.dot }]} />
          <Text style={[styles.label, { color: c.label, fontSize: 13 }]}>
            {currentQuote.category}
          </Text>
        </View>

        {/* Guillemet */}
        <Text style={[styles.guillemet, { color: c.dot }]}>{"\u201C"}</Text>

        {/* Quote Text */}
        <Text style={[styles.quoteText, { color: c.text }]}>
          {currentQuote.text}
        </Text>

        {/* Author */}
        <Text style={[styles.author, { color: c.author }]}>
          — {currentQuote.author}
        </Text>
      </Animated.View>

      {/* ── Bottom Section ── */}
      <View style={styles.bottomSection}>
        {/* Pagination Dots */}
        <View style={styles.dotsRow}>
          {QUOTES.map((_, i) => (
            <View
              key={i}
              style={[
                i === currentIndex ? styles.dotActive : styles.dotInactive,
                {
                  backgroundColor: i === currentIndex ? c.dot : c.inactiveDot,
                },
              ]}
            />
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <Pressable
            style={[styles.actionBtn, { backgroundColor: c.btnBg }]}
            onPress={goPrev}
          >
            <Ionicons name="chevron-back" size={20} color={c.btnIcon} />
          </Pressable>

          <Pressable
            style={[styles.actionBtn, { backgroundColor: c.btnBg }]}
            onPress={toggleBookmark}
          >
            <Ionicons
              name={isSaved ? "bookmark" : "bookmark-outline"}
              size={20}
              color={isSaved ? c.label : c.btnIcon}
            />
          </Pressable>

          <Pressable
            style={[styles.actionBtn, { backgroundColor: c.btnBg }]}
            onPress={() => Alert.alert("Share", "Share feature coming soon!")}
          >
            <Ionicons name="share-outline" size={20} color={c.btnIcon} />
          </Pressable>

          <Pressable
            style={[styles.actionBtn, { backgroundColor: c.btnBg }]}
            onPress={goNext}
          >
            <Ionicons name="chevron-forward" size={20} color={c.btnIcon} />
          </Pressable>
        </View>

        {/* History */}
        <Pressable style={styles.historyRow} onPress={openHistory}>
          <Text style={[styles.label, { color: c.menuIcon, fontSize: 12 }]}>
            HISTORY
          </Text>
          <Ionicons name="chevron-down" size={16} color={c.menuIcon} />
        </Pressable>
      </View>

      {/* ── History Modal ── */}
      {historyVisible && (
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
            <Pressable style={StyleSheet.absoluteFill} onPress={closeHistory} />
          </Animated.View>

          {/* Sheet */}
          <Animated.View
            style={[
              styles.sheet,
              {
                backgroundColor: c.sheetBg,
                transform: [{ translateY: sheetAnim }],
              },
            ]}
          >
            {/* Handle */}
            <View style={styles.sheetHandleContainer}>
              <View
                style={[styles.sheetHandle, { backgroundColor: c.sheetHandle }]}
              />
            </View>

            {/* Sheet Header */}
            <View style={styles.sheetHeader}>
              <Text
                style={[
                  styles.sheetTitle,
                  {
                    color: c.sheetTitle,
                    fontFamily: "CormorantGaramond_400Regular_Italic",
                  },
                ]}
              >
                Saved Quotes
              </Text>
              <Pressable onPress={closeHistory}>
                <Text style={[styles.doneBtn, { color: c.label }]}>Done</Text>
              </Pressable>
            </View>

            {/* Divider */}
            <View
              style={[styles.sheetDivider, { backgroundColor: c.divider }]}
            />

            {/* Content */}
            {savedQuotes.length === 0 ? (
              <View style={styles.sheetEmptyContainer}>
                <Text
                  style={[
                    styles.sheetEmptyText,
                    {
                      color: c.sheetEmpty,
                      fontFamily: "CormorantGaramond_400Regular_Italic",
                    },
                  ]}
                >
                  No saved quotes yet.
                </Text>
                <Text
                  style={[
                    styles.sheetEmptyText,
                    {
                      color: c.sheetEmpty,
                      fontFamily: "CormorantGaramond_400Regular_Italic",
                    },
                  ]}
                >
                  Bookmark ones that speak to you.
                </Text>
              </View>
            ) : (
              <View style={styles.sheetList}>
                {savedQuotes.map((q) => (
                  <View key={q.id} style={styles.savedQuoteItem}>
                    <Text
                      style={[
                        styles.savedQuoteText,
                        {
                          color: c.text,
                          fontFamily: "CormorantGaramond_400Regular_Italic",
                        },
                      ]}
                    >
                      "{q.text}"
                    </Text>
                    <Text
                      style={[styles.savedQuoteAuthor, { color: c.author }]}
                    >
                      — {q.author}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </Animated.View>
        </>
      )}
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

  // ── Modal ──
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
  sheetHandleContainer: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 6,
  },
  sheetHandle: {
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
  sheetEmptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  sheetEmptyText: {
    fontSize: 18,
    fontStyle: "italic",
    textAlign: "center",
  },
  sheetList: {
    flex: 1,
    paddingTop: 20,
    paddingHorizontal: 24,
  },
  savedQuoteItem: {
    marginBottom: 24,
  },
  savedQuoteText: {
    fontSize: 20,
    lineHeight: 28,
    fontStyle: "italic",
    marginBottom: 6,
  },
  savedQuoteAuthor: {
    fontSize: 14,
    textAlign: "right",
  },
});
