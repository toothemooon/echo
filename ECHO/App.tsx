import { useState, useEffect, useRef } from "react";
import { View, Animated, Dimensions } from "react-native";
import { StatusBar } from "expo-status-bar";
import {
  useFonts,
  CormorantGaramond_400Regular_Italic,
} from "@expo-google-fonts/cormorant-garamond";
import { COLORS } from "./src/constants/colors";
import { QUOTES, Quote } from "./src/data/quotes";
import Header from "./src/components/Header";
import QuoteCard from "./src/components/QuoteCard";
import PaginationDots from "./src/components/PaginationDots";
import ActionBar from "./src/components/ActionBar";
import HistorySheet from "./src/components/HistorySheet";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

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
      setCurrentIndex((prev) => {
        if (direction === "right") {
          return prev < QUOTES.length - 1 ? prev + 1 : 0;
        } else {
          return prev > 0 ? prev - 1 : QUOTES.length - 1;
        }
      });

      slideAnim.setValue(-toSlide);
      fadeAnim.setValue(0);

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

  // ── Handlers ──
  const goNext = () => animateQuote("right");
  const goPrev = () => animateQuote("left");

  const toggleBookmark = () => {
    if (isSaved) {
      setSavedQuotes((prev) => prev.filter((q) => q.id !== currentQuote.id));
    } else {
      setSavedQuotes((prev) => [...prev, currentQuote]);
    }
  };

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
    <View
      style={{
        flex: 1,
        backgroundColor: c.background,
        paddingTop: 60,
        paddingHorizontal: 32,
        paddingBottom: 40,
      }}
    >
      <StatusBar style={statusBar} />

      <Header
        colors={c}
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
      />

      <QuoteCard
        quote={currentQuote}
        colors={c}
        fadeAnim={fadeAnim}
        slideAnim={slideAnim}
      />

      <View style={{ alignItems: "center" }}>
        <PaginationDots
          total={QUOTES.length}
          activeIndex={currentIndex}
          colors={c}
        />

        <ActionBar
          colors={c}
          isSaved={isSaved}
          onPrev={goPrev}
          onNext={goNext}
          onBookmark={toggleBookmark}
          onHistory={openHistory}
        />
      </View>

      <HistorySheet
        visible={historyVisible}
        savedQuotes={savedQuotes}
        colors={c}
        sheetAnim={sheetAnim}
        backdropAnim={backdropAnim}
        onClose={closeHistory}
      />
    </View>
  );
}
