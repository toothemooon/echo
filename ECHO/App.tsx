import { useState, useEffect, useRef } from "react";
import { View, Animated, Dimensions, Share } from "react-native";
import { StatusBar } from "expo-status-bar";
import {
  useFonts,
  CormorantGaramond_400Regular_Italic,
} from "@expo-google-fonts/cormorant-garamond";
import { COLORS } from "./src/constants/colors";
import { Quote, getRandomQuote, getQuoteCount } from "./src/database/quotes";
import { syncDatabase } from "./src/database/seed";
import Header from "./src/components/Header";
import QuoteCard from "./src/components/QuoteCard";
import PaginationDots from "./src/components/PaginationDots";
import ActionBar from "./src/components/ActionBar";
import HistorySheet from "./src/components/HistorySheet";
import SettingsScreen from "./src/screens/SettingsScreen";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const PLACEHOLDER_QUOTE: Quote = {
  id: 0,
  text: "Loading...",
  author: "",
  category: "",
};

export default function App() {
  const [isDark, setIsDark] = useState(false);
  const [quoteHistory, setQuoteHistory] = useState<Quote[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [quoteCount, setQuoteCount] = useState(0);
  const [savedQuotes, setSavedQuotes] = useState<Quote[]>([]);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState<"home" | "settings">("home");
  const [dbReady, setDbReady] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const sheetAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const [fontsLoaded] = useFonts({
    CormorantGaramond_400Regular_Italic,
  });

  // Initialize database, seed data, load first quote
  useEffect(() => {
    async function init() {
      const colorScheme = require("react-native").Appearance?.getColorScheme();
      if (colorScheme === "dark") setIsDark(true);

      await syncDatabase();
      const count = await getQuoteCount();
      setQuoteCount(count);

      const firstQuote = await getRandomQuote();
      if (firstQuote) {
        setQuoteHistory([firstQuote]);
        setHistoryIndex(0);
      }

      setDbReady(true);
    }
    init();
  }, []);

  if (!fontsLoaded || !dbReady) return null;

  const c = isDark ? COLORS.dark : COLORS.light;
  const statusBar = isDark ? "light" : "dark";
  const currentQuote =
    historyIndex >= 0 ? quoteHistory[historyIndex] : PLACEHOLDER_QUOTE;
  const isSaved = savedQuotes.some((q) => q.id === currentQuote.id);
  const canGoPrev = historyIndex > 0;
  const canGoNext = historyIndex < quoteHistory.length - 1;

  // ── Quote Transition Animation ──
  const animateToQuote = (newQuote: Quote, direction: "left" | "right") => {
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
  const goNext = () => {
    if (canGoNext) {
      // Already have a next quote in history — just move forward
      const nextIdx = historyIndex + 1;
      setHistoryIndex(nextIdx);
      animateToQuote(quoteHistory[nextIdx], "right");
    } else {
      // Fetch a new random quote and append to history
      getRandomQuote().then((newQuote) => {
        if (!newQuote) return;
        setQuoteHistory((prev) => [...prev, newQuote]);
        setHistoryIndex((prev) => prev + 1);
        animateToQuote(newQuote, "right");
      });
    }
  };

  const goPrev = () => {
    if (!canGoPrev) return;
    const prevIdx = historyIndex - 1;
    setHistoryIndex(prevIdx);
    animateToQuote(quoteHistory[prevIdx], "left");
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `"${currentQuote.text}"\n— ${currentQuote.author}`,
      });
    } catch (_error) {
      // User cancelled
    }
  };

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

  if (currentPage === "settings") {
    return (
      <SettingsScreen
        colors={c}
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
        onBack={() => setCurrentPage("home")}
      />
    );
  }

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
        onMenu={() => setCurrentPage("settings")}
      />

      <QuoteCard
        quote={currentQuote}
        colors={c}
        fadeAnim={fadeAnim}
        slideAnim={slideAnim}
      />

      <View style={{ alignItems: "center" }}>
        <PaginationDots total={5} activeIndex={historyIndex % 5} colors={c} />

        <ActionBar
          colors={c}
          isSaved={isSaved}
          onPrev={canGoPrev ? goPrev : undefined}
          onNext={goNext}
          onBookmark={toggleBookmark}
          onShare={handleShare}
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
