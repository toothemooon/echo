import { useState, useEffect, useRef } from "react";
import { View, Animated, Dimensions, Alert } from "react-native";
import { StatusBar } from "expo-status-bar";
import { captureRef } from "react-native-view-shot";
import {
  useFonts,
  CormorantGaramond_400Regular_Italic,
} from "@expo-google-fonts/cormorant-garamond";
import { COLORS } from "../constants/colors";
import { CATEGORIES, Category } from "../constants/categories";
import {
  Quote,
  getRandomQuote,
  getQuoteCount,
  getSavedQuotes,
  addSavedQuote,
  removeSavedQuote,
} from "../database/quotes";
import {
  getPreferredCategories,
  setPreferredCategories,
  getTheme,
  setTheme,
} from "../database/preferences";
import { syncDatabase } from "../database/seed";

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

const PLACEHOLDER_QUOTE: Quote = {
  id: 0,
  text: "Loading...",
  author: "",
  role: "",
  primary_category: "",
  categories: [],
};

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
  const [preferredCategories, setPreferredCategoriesState] = useState<
    Category[]
  >([...CATEGORIES]);
  const [savedQuotes, setSavedQuotes] = useState<Quote[]>([]);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [dbReady, setDbReady] = useState(false);

  // ── Home State ──
  const [quoteHistory, setQuoteHistory] = useState<Quote[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [quoteCount, setQuoteCount] = useState(0);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [shareVisible, setShareVisible] = useState(false);

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

  // ── 主题 ──
  const persistTheme = (dark: boolean) => {
    setIsDark(dark);
    setTheme(dark ? "dark" : "light");
  };

  // ── 分类 ──
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

  // ── 收藏 ──
  const toggleBookmark = async () => {
    const currentQuote =
      historyIndex >= 0 ? quoteHistory[historyIndex] : PLACEHOLDER_QUOTE;
    const isSaved = savedQuotes.some((q) => q.id === currentQuote.id);
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

  // ── 分享 ──
  const handleShare = () => setShareVisible(true);

  const shareAsImage = async () => {
    const currentQuote =
      historyIndex >= 0 ? quoteHistory[historyIndex] : PLACEHOLDER_QUOTE;
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

  // ── 动画 ──
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

  const goNext = () => {
    if (isAnimating.current) return;
    const canGoNext = historyIndex < quoteHistory.length - 1;

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
    if (isAnimating.current || historyIndex <= 0) return;
    animateToQuote(historyIndex - 1, "left");
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

  // ── 派生值 ──
  if (!fontsLoaded || !dbReady) return null;

  const colors = isDark ? COLORS.dark : COLORS.light;
  const currentQuote =
    historyIndex >= 0 ? quoteHistory[historyIndex] : PLACEHOLDER_QUOTE;
  const isSaved = savedQuotes.some((q) => q.id === currentQuote.id);
  const canGoPrev = historyIndex > 0;

  // ── 页面路由（currentPage 条件渲染） ──
  if (currentPage === "theme") {
    return (
      <ThemeScreen
        colors={colors}
        isDark={isDark}
        onToggleTheme={() => persistTheme(!isDark)}
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
        onToggleTheme={() => persistTheme(!isDark)}
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
          onShare={handleShare}
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
