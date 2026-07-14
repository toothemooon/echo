import { useState, useEffect, useRef } from "react";
import { View, Animated, Dimensions, Share } from "react-native";
import { StatusBar } from "expo-status-bar";
import {
  useFonts,
  CormorantGaramond_400Regular_Italic,
} from "@expo-google-fonts/cormorant-garamond";
import { COLORS } from "./src/constants/colors";
import { Quote, getRandomQuote, getQuoteCount } from "./src/database/quotes";
import { seedDatabase } from "./src/database/seed";
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
  const [currentQuote, setCurrentQuote] = useState<Quote>(PLACEHOLDER_QUOTE);
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

      await seedDatabase();
      const count = await getQuoteCount();
      setQuoteCount(count);

      const quote = await getRandomQuote();
      if (quote) setCurrentQuote(quote);

      setDbReady(true);
    }
    init();
  }, []);

  if (!fontsLoaded || !dbReady) return null;

  const c = isDark ? COLORS.dark : COLORS.light;
  const statusBar = isDark ? "light" : "dark";
  const isSaved = savedQuotes.some((q) => q.id === currentQuote.id);

  // ── Quote Transition Animation ──
  const animateQuote = async (direction: "left" | "right") => {
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
    ]).start(async () => {
      // Fetch a new random quote from SQLite
      const newQuote = await getRandomQuote();
      if (newQuote) setCurrentQuote(newQuote);

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
        <PaginationDots
          total={Math.min(quoteCount, 50)}
          activeIndex={0}
          colors={c}
        />

        <ActionBar
          colors={c}
          isSaved={isSaved}
          onPrev={goPrev}
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
