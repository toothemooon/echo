import { useState, useEffect, useRef } from "react";
import { View, Animated, Dimensions, Alert, Appearance } from "react-native";
import { StatusBar } from "expo-status-bar";
import SplashScreen from "../components/common/SplashScreen";
import { captureRef } from "react-native-view-shot";
import {
  useFonts,
  CormorantGaramond_400Regular_Italic,
} from "@expo-google-fonts/cormorant-garamond";
import { COLORS } from "../constants/colors";
import { CATEGORIES, Category } from "../constants/categories";
import { getRandomQuote, type Quote } from "../data/quotes";
import {
  getPreferredCategories,
  setPreferredCategories as savePreferredCategories,
  getTheme,
  setTheme,
} from "../storage/preferences";
import {
  getSavedQuotes,
  removeSavedQuote,
  saveQuote,
} from "../storage/savedQuotes";

// Home 组件
import Header from "../components/home/Header";
import QuoteCard from "../components/home/QuoteCard";
import ActionBar from "../components/home/ActionBar";
import HistorySheet from "../components/home/HistorySheet";
import ShareCard from "../components/home/ShareCard";
import ShareSheet from "../components/home/ShareSheet";

// 页面组件
import SettingsScreen from "../screens/SettingsScreen";
import PersonalizationScreen from "../screens/PersonalizationScreen";
import ThemeScreen from "../screens/ThemeScreen";

// ── 常量 ──
const { height: SCREEN_HEIGHT } = Dimensions.get("window");

type Page = "home" | "settings" | "theme" | "personalization";

// ══════════════════════════════════════════════════════
//  ECHO — 唯一路由页面
//  职责：持有全部 State，条件渲染，Props 向下传递
//  数据流：State → Props → 子组件 → 回调 Props → 修改 State
// ══════════════════════════════════════════════════════
export default function Index() {
  const [fontsLoaded] = useFonts({
    CormorantGaramond_400Regular_Italic,
  });

  // ── 跨页面 State ──
  const [currentPage, setCurrentPage] = useState<Page>("home");
  const [isDark, setIsDark] = useState(false);
  const [preferredCategories, setPreferredCategories] = useState<Category[]>([
    ...CATEGORIES,
  ]);
  const [savedQuotes, setSavedQuotes] = useState<Quote[]>([]);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [initializationReady, setInitializationReady] = useState(false);

  // ── Home State ──
  const [quoteHistory, setQuoteHistory] = useState<Quote[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [shareVisible, setShareVisible] = useState(false);

  // ── Splash Screen State ──
  const [showSplash, setShowSplash] = useState(true);

  // ── useRef 动画和组件引用 ──
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const sheetAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const isAnimating = useRef(false);
  const shareCardRef = useRef<View>(null);

  // ── useEffect 初始化 ──
  useEffect(() => {
    async function init() {
      try {
        const [savedTheme, prefs, savedRecords] = await Promise.all([
          getTheme(),
          getPreferredCategories(),
          getSavedQuotes(),
        ]);

        const shouldUseDarkTheme = savedTheme
          ? savedTheme === "dark"
          : Appearance.getColorScheme() === "dark";
        setIsDark(shouldUseDarkTheme);
        setPreferredCategories(prefs);
        setSavedQuotes(savedRecords.map((record) => record.quote));

        const firstQuote = getRandomQuote(prefs);
        if (firstQuote) {
          setQuoteHistory([firstQuote]);
          setHistoryIndex(0);
        }
      } catch (error) {
        if (__DEV__) {
          console.warn(
            "Failed to initialize local app data.",
            error instanceof Error ? error.message : "Unknown error",
          );
        }
      } finally {
        setInitializationReady(true);
      }
    }
    init();
  }, []);

  // ── 派生值（统一计算一次） ──
  const currentQuote = quoteHistory[historyIndex] ?? null;

  // Splash screen: show while loading
  if (!fontsLoaded || !initializationReady || !currentQuote) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: isDark
            ? COLORS.dark.background
            : COLORS.light.background,
        }}
      >
        <SplashScreen
          isDark={isDark}
          onAnimationComplete={() => setShowSplash(false)}
        />
      </View>
    );
  }

  const colors = isDark ? COLORS.dark : COLORS.light;
  const isSaved = savedQuotes.some((q) => q.id === currentQuote.id);
  const canGoPrev = historyIndex > 0;

  // ── 主题 ──
  const toggleTheme = () => {
    const nextIsDark = !isDark;
    setIsDark(nextIsDark);
    void setTheme(nextIsDark ? "dark" : "light").catch(() => undefined);
  };

  // ── 分类 ──
  const toggleCategory = (category: Category) => {
    setPreferredCategories((previous) => {
      const next = previous.includes(category)
        ? previous.filter((c) => c !== category)
        : [...previous, category];
      if (next.length === 0) return previous;
      void savePreferredCategories(next).catch(() => undefined);
      return next;
    });
  };

  // ── 收藏 ──
  const toggleBookmark = async () => {
    try {
      if (isSaved) {
        await removeSavedQuote(currentQuote.id);
        setSavedQuotes((prev) => prev.filter((q) => q.id !== currentQuote.id));
      } else {
        await saveQuote(currentQuote);
        setSavedQuotes((prev) => [
          currentQuote,
          ...prev.filter((q) => q.id !== currentQuote.id),
        ]);
      }
    } catch (_error) {
      if (__DEV__) {
        console.warn("Bookmark state was not updated because saving failed.");
      }
    }
  };

  const handleRemoveSaved = async (quoteId: Quote["id"]) => {
    try {
      await removeSavedQuote(quoteId);
      setSavedQuotes((prev) => prev.filter((q) => q.id !== quoteId));
    } catch (_error) {
      if (__DEV__) {
        console.warn("Saved quote was not removed because saving failed.");
      }
    }
  };

  // ── 分享 ──
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

  // ── 统一动画函数 ──
  const runQuoteTransition = (
    direction: "left" | "right",
    updateQuote: () => void,
  ) => {
    if (isAnimating.current) return;
    isAnimating.current = true;

    const offset = direction === "left" ? -60 : 60;

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: offset,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      updateQuote();

      slideAnim.setValue(-offset);
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

  // ── 名言导航 ──
  const goNext = () => {
    if (isAnimating.current) return;
    const canGoNext = historyIndex < quoteHistory.length - 1;

    if (canGoNext) {
      runQuoteTransition("right", () => {
        setHistoryIndex((prev) => prev + 1);
      });
    } else {
      const newQuote = getRandomQuote(preferredCategories);
      if (!newQuote) return;
      runQuoteTransition("right", () => {
        setQuoteHistory((prev) => [...prev, newQuote]);
        setHistoryIndex((prev) => prev + 1);
      });
    }
  };

  const goPrev = () => {
    if (historyIndex <= 0) return;
    runQuoteTransition("left", () => {
      setHistoryIndex((prev) => prev - 1);
    });
  };

  // ── 历史弹窗 ──
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

  // ── 页面路由（currentPage 条件渲染） ──
  if (currentPage === "theme") {
    return (
      <ThemeScreen
        colors={colors}
        isDark={isDark}
        onToggleTheme={toggleTheme}
        onBack={() => setCurrentPage("settings")}
      />
    );
  }

  if (currentPage === "personalization") {
    return (
      <PersonalizationScreen
        colors={colors}
        preferredCategories={preferredCategories}
        onToggleCategory={toggleCategory}
        onBack={() => setCurrentPage("settings")}
      />
    );
  }

  if (currentPage === "settings") {
    return (
      <SettingsScreen
        colors={colors}
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

  // ── Home 页面 ──
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingTop: 60,
        paddingHorizontal: 32,
        paddingBottom: 40,
      }}
    >
      <StatusBar style={isDark ? "light" : "dark"} animated />

      <Header
        colors={colors}
        isDark={isDark}
        onToggleTheme={toggleTheme}
        onMenu={() => setCurrentPage("settings")}
      />

      <QuoteCard
        quote={currentQuote}
        colors={colors}
        fadeAnim={fadeAnim}
        slideAnim={slideAnim}
      />

      <View style={{ alignItems: "center" }}>
        <ActionBar
          colors={colors}
          isSaved={isSaved}
          onPrev={canGoPrev ? goPrev : undefined}
          onNext={goNext}
          onBookmark={toggleBookmark}
          onShare={() => setShareVisible(true)}
          onHistory={openHistory}
        />
      </View>

      <HistorySheet
        visible={historyVisible}
        savedQuotes={savedQuotes}
        colors={colors}
        sheetAnim={sheetAnim}
        backdropAnim={backdropAnim}
        onClose={closeHistory}
        onRemove={handleRemoveSaved}
      />

      <ShareSheet
        visible={shareVisible}
        quote={currentQuote}
        colors={colors}
        onClose={() => setShareVisible(false)}
        onShareAsImage={() => {
          setShareVisible(false);
          shareAsImage();
        }}
      />

      {/* 离屏 ShareCard，用于 react-native-view-shot 截图 */}
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
        <ShareCard quote={currentQuote} colors={colors} />
      </View>
    </View>
  );
}
