import { useState, useEffect, useRef } from "react";
import { View, Animated, Dimensions, Share, Alert } from "react-native";
import { StatusBar } from "expo-status-bar";
import { captureRef } from "react-native-view-shot";
import {
  useFonts,
  CormorantGaramond_400Regular_Italic,
} from "@expo-google-fonts/cormorant-garamond";
import { COLORS } from "./src/constants/colors";
import { CATEGORIES, Category } from "./src/constants/categories";
import {
  Quote,
  getRandomQuote,
  getQuoteCount,
  getSavedQuotes,
  addSavedQuote,
  removeSavedQuote,
} from "./src/database/quotes";
import {
  getPreferredCategories,
  setPreferredCategories,
  getTheme,
  setTheme,
} from "./src/database/preferences";
import { syncDatabase } from "./src/database/seed";
import Header from "./src/components/Header";
import QuoteCard from "./src/components/QuoteCard";
import ActionBar from "./src/components/ActionBar";
import HistorySheet from "./src/components/HistorySheet";
import ShareCard from "./src/components/ShareCard";
import ShareScreen from "./src/screens/ShareScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import PersonalizationScreen from "./src/screens/PersonalizationScreen";
import ThemeScreen from "./src/screens/ThemeScreen";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const PLACEHOLDER_QUOTE: Quote = {
  id: 0,
  text: "Loading...",
  author: "",
  role: "",
  primary_category: "",
  categories: [],
};

export default function App() {
  const [isDark, setIsDark] = useState(false);
  const [quoteHistory, setQuoteHistory] = useState<Quote[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [quoteCount, setQuoteCount] = useState(0);
  const [savedQuotes, setSavedQuotes] = useState<Quote[]>([]);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [shareVisible, setShareVisible] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [currentPage, setCurrentPage] = useState<
    "home" | "settings" | "personalization" | "theme"
  >("home");
  const [preferredCategories, setPreferredCategoriesState] = useState<
    Category[]
  >([...CATEGORIES]);
  const [dbReady, setDbReady] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const sheetAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  // Refs
  const isAnimating = useRef(false);
  const shareCardRef = useRef<View>(null);

  const [fontsLoaded] = useFonts({
    CormorantGaramond_400Regular_Italic,
  });

  // Initialize database, seed data, load first quote
  useEffect(() => {
    async function init() {
      const savedTheme = await getTheme();
      if (savedTheme) {
        setIsDark(savedTheme === "dark");
      } else {
        const colorScheme =
          require("react-native").Appearance?.getColorScheme();
        if (colorScheme === "dark") setIsDark(true);
      }

      await syncDatabase();

      const prefs = await getPreferredCategories();
      setPreferredCategoriesState(prefs);

      const saved = await getSavedQuotes();
      setSavedQuotes(saved);

      const count = await getQuoteCount();
      setQuoteCount(count);

      const firstQuote = await getRandomQuote(prefs);
      if (firstQuote) {
        setQuoteHistory([firstQuote]);
        setHistoryIndex(0);
      }

      setDbReady(true);
    }
    init();
  }, []);

  const persistTheme = (dark: boolean) => {
    setIsDark(dark);
    setTheme(dark ? "dark" : "light");
  };

  if (!fontsLoaded || !dbReady) return null;

  const c = isDark ? COLORS.dark : COLORS.light;
  const statusBar = isDark ? "light" : "dark";
  const currentQuote =
    historyIndex >= 0 ? quoteHistory[historyIndex] : PLACEHOLDER_QUOTE;
  const isSaved = savedQuotes.some((q) => q.id === currentQuote.id);
  const canGoPrev = historyIndex > 0;
  const canGoNext = historyIndex < quoteHistory.length - 1;

  // ── Quote Transition Animation ──
  const animateToQuote = (newIndex: number, direction: "left" | "right") => {
    if (isAnimating.current) return;
    isAnimating.current = true;

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
      setHistoryIndex(newIndex);
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
      ]).start(() => {
        isAnimating.current = false;
      });
    });
  };

  // ── Handlers ──
  const goNext = () => {
    if (isAnimating.current) return;

    if (canGoNext) {
      animateToQuote(historyIndex + 1, "right");
    } else {
      isAnimating.current = true;
      getRandomQuote(preferredCategories).then((newQuote) => {
        if (!newQuote) {
          isAnimating.current = false;
          return;
        }
        const toSlide = 60;

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
          setQuoteHistory((prev) => [...prev, newQuote]);
          setHistoryIndex((prev) => prev + 1);

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
          ]).start(() => {
            isAnimating.current = false;
          });
        });
      });
    }
  };

  const goPrev = () => {
    if (isAnimating.current || !canGoPrev) return;
    animateToQuote(historyIndex - 1, "left");
  };

  // ── Share ──
  const handleShare = () => setShareVisible(true);

  const shareAsImage = async () => {
    try {
      const uri = await captureRef(shareCardRef, {
        format: "png",
        quality: 1,
        result: "tmpfile",
      });
      const { Share: RNShare } = require("react-native");
      await RNShare.share({
        url: uri,
        message: `"${currentQuote.text}"\n— ${currentQuote.author}\n\nShared from Echo`,
      });
    } catch (_error) {
      Alert.alert("Error", "Failed to generate image.");
    }
  };

  const toggleCategory = (cat: Category) => {
    setPreferredCategoriesState((prev) => {
      const next = prev.includes(cat)
        ? prev.filter((c) => c !== cat)
        : [...prev, cat];
      if (next.length === 0) return prev;
      setPreferredCategories(next);
      return next;
    });
  };

  const toggleBookmark = async () => {
    if (isSaved) {
      await removeSavedQuote(currentQuote.id);
      setSavedQuotes((prev) => prev.filter((q) => q.id !== currentQuote.id));
    } else {
      await addSavedQuote(currentQuote.id);
      setSavedQuotes((prev) => [...prev, currentQuote]);
    }
  };

  const handleRemoveSaved = async (quoteId: number) => {
    await removeSavedQuote(quoteId);
    setSavedQuotes((prev) => prev.filter((q) => q.id !== quoteId));
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

  // ── Page routing ──
  if (currentPage === "theme") {
    return (
      <ThemeScreen
        colors={c}
        isDark={isDark}
        onToggleTheme={() => persistTheme(!isDark)}
        onBack={() => setCurrentPage("settings")}
      />
    );
  }

  if (currentPage === "personalization") {
    return (
      <PersonalizationScreen
        colors={c}
        preferredCategories={preferredCategories}
        onToggleCategory={toggleCategory}
        onBack={() => setCurrentPage("settings")}
      />
    );
  }

  if (currentPage === "settings") {
    return (
      <SettingsScreen
        colors={c}
        isDark={isDark}
        reminderEnabled={reminderEnabled}
        onToggleReminder={() => setReminderEnabled((v) => !v)}
        onBack={() => setCurrentPage("home")}
        onOpenPersonalization={() => setCurrentPage("personalization")}
        onOpenTheme={() => setCurrentPage("theme")}
        preferredCount={preferredCategories.length}
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
        onToggleTheme={() => persistTheme(!isDark)}
        onMenu={() => setCurrentPage("settings")}
      />

      <QuoteCard
        quote={currentQuote}
        colors={c}
        fadeAnim={fadeAnim}
        slideAnim={slideAnim}
      />

      <View style={{ alignItems: "center" }}>
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
        onRemove={handleRemoveSaved}
      />

      <ShareScreen
        visible={shareVisible}
        quote={currentQuote}
        colors={c}
        onClose={() => setShareVisible(false)}
        onShareAsImage={() => {
          setShareVisible(false);
          shareAsImage();
        }}
      />

      {/* Offscreen ShareCard for image capture */}
      <View
        ref={shareCardRef}
        style={{
          position: "absolute",
          left: -1000,
          top: 0,
          opacity: 1,
        }}
        collapsable={false}
      >
        <ShareCard quote={currentQuote} colors={c} />
      </View>
    </View>
  );
}
