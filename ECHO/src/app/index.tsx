import { useState, useEffect, useRef } from "react";
import { View, Animated, Dimensions, Alert, Appearance } from "react-native";
import { StatusBar } from "expo-status-bar";
import { captureRef } from "react-native-view-shot";
import {
  useFonts,
  CormorantGaramond_400Regular_Italic,
} from "@expo-google-fonts/cormorant-garamond";

import SplashScreen from "../components/common/SplashScreen";
import { COLORS } from "../constants/colors";
import { CATEGORIES, type Category } from "../constants/categories";
import { getRandomQuote, type Quote } from "../data/quotes";

import {
  getPreferredCategories,
  setPreferredCategories as savePreferredCategories,
  getTheme,
  setTheme,
  getQuoteFont,
  setQuoteFont,
  getQuoteFontSize,
  setQuoteFontSize,
  type QuoteFont,
  type QuoteFontSize,
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
import QuoteSettingsScreen from "../screens/QuoteSettingsScreen";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

type Page =
  | "home"
  | "settings"
  | "theme"
  | "personalization"
  | "quote-settings";

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

  const [quoteFont, setQuoteFontState] = useState<QuoteFont>("elegant");

  const [quoteFontSize, setQuoteFontSizeState] =
    useState<QuoteFontSize>("medium");

  const [initializationReady, setInitializationReady] = useState(false);

  // ── Home State ──
  const [quoteHistory, setQuoteHistory] = useState<Quote[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [shareVisible, setShareVisible] = useState(false);

  // ── Splash Screen State ──
  const [showSplash, setShowSplash] = useState(true);

  // ── 动画和组件引用 ──
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const sheetAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const isAnimating = useRef(false);
  const shareCardRef = useRef<View>(null);

  // ── 初始化 ──
  useEffect(() => {
    async function init() {
      try {
        const [
          savedTheme,
          prefs,
          savedRecords,
          savedQuoteFont,
          savedQuoteFontSize,
        ] = await Promise.all([
          getTheme(),
          getPreferredCategories(),
          getSavedQuotes(),
          getQuoteFont(),
          getQuoteFontSize(),
        ]);

        const shouldUseDarkTheme = savedTheme
          ? savedTheme === "dark"
          : Appearance.getColorScheme() === "dark";

        setIsDark(shouldUseDarkTheme);
        setPreferredCategories(prefs);
        setSavedQuotes(savedRecords.map((record) => record.quote));
        setQuoteFontState(savedQuoteFont);
        setQuoteFontSizeState(savedQuoteFontSize);

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

    void init();
  }, []);

  // ── 派生值 ──
  const currentQuote = quoteHistory[historyIndex] ?? null;

  // ── 启动页 ──
  if (!fontsLoaded || !initializationReady || !currentQuote || showSplash) {
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

  const isSaved = savedQuotes.some((quote) => quote.id === currentQuote.id);

  const canGoPrev = historyIndex > 0;

  // ── 主题 ──
  const toggleTheme = () => {
    const nextIsDark = !isDark;

    setIsDark(nextIsDark);

    void setTheme(nextIsDark ? "dark" : "light").catch(() => {
      if (__DEV__) {
        console.warn("Failed to save theme.");
      }
    });
  };

  // ── 字体 ──
  const changeQuoteFont = (font: QuoteFont) => {
    setQuoteFontState(font);

    void setQuoteFont(font).catch(() => {
      if (__DEV__) {
        console.warn("Failed to save quote font.");
      }
    });
  };

  const changeQuoteFontSize = (size: QuoteFontSize) => {
    setQuoteFontSizeState(size);

    void setQuoteFontSize(size).catch(() => {
      if (__DEV__) {
        console.warn("Failed to save quote font size.");
      }
    });
  };

  // ── 分类 ──
  const toggleCategory = (category: Category) => {
    const next = preferredCategories.includes(category)
      ? preferredCategories.filter((item) => item !== category)
      : [...preferredCategories, category];

    if (next.length === 0) {
      return;
    }

    setPreferredCategories(next);

    const firstMatchingQuote = getRandomQuote(next);
    if (firstMatchingQuote) {
      setQuoteHistory([firstMatchingQuote]);
      setHistoryIndex(0);
    }

    void savePreferredCategories(next).catch(() => {
      if (__DEV__) {
        console.warn("Failed to save preferred categories.");
      }
    });
  };

  // ── 收藏 ──
  const toggleBookmark = async () => {
    try {
      if (isSaved) {
        await removeSavedQuote(currentQuote.id);

        setSavedQuotes((previous) =>
          previous.filter((quote) => quote.id !== currentQuote.id),
        );
      } else {
        await saveQuote(currentQuote);

        setSavedQuotes((previous) => [
          currentQuote,
          ...previous.filter((quote) => quote.id !== currentQuote.id),
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

      setSavedQuotes((previous) =>
        previous.filter((quote) => quote.id !== quoteId),
      );
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
        message:
          `"${currentQuote.text}"\n` +
          `— ${currentQuote.author}\n\n` +
          "Shared from Echo",
      });
    } catch (_error) {
      Alert.alert("Error", "Failed to generate image.");
    }
  };

  // ── 名言切换动画 ──
  const runQuoteTransition = (
    direction: "left" | "right",
    updateQuote: () => void,
  ) => {
    if (isAnimating.current) {
      return;
    }

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

  // ── 下一条名言 ──
  const goNext = () => {
    if (isAnimating.current) {
      return;
    }

    const canGoNext = historyIndex < quoteHistory.length - 1;

    if (canGoNext) {
      runQuoteTransition("right", () => {
        setHistoryIndex((previous) => previous + 1);
      });

      return;
    }

    const newQuote = getRandomQuote(
      preferredCategories,
      quoteHistory.map((quote) => quote.id),
    );

    if (!newQuote) {
      return;
    }

    runQuoteTransition("right", () => {
      setQuoteHistory((previous) => [...previous, newQuote]);

      setHistoryIndex((previous) => previous + 1);
    });
  };

  // ── 上一条名言 ──
  const goPrev = () => {
    if (historyIndex <= 0) {
      return;
    }

    runQuoteTransition("left", () => {
      setHistoryIndex((previous) => previous - 1);
    });
  };

  // ── 打开历史记录 ──
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

  // ── 关闭历史记录 ──
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
    ]).start(() => {
      setHistoryVisible(false);
    });
  };

  // ── Theme 页面 ──
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

  // ── Personalization 页面 ──
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

  // ── Quote Settings 页面 ──
  if (currentPage === "quote-settings") {
    return (
      <QuoteSettingsScreen
        colors={colors}
        quoteFont={quoteFont}
        quoteFontSize={quoteFontSize}
        onChangeQuoteFont={changeQuoteFont}
        onChangeQuoteFontSize={changeQuoteFontSize}
        onBack={() => setCurrentPage("settings")}
      />
    );
  }

  // ── Settings 页面 ──
  if (currentPage === "settings") {
    return (
      <SettingsScreen
        colors={colors}
        isDark={isDark}
        onBack={() => setCurrentPage("home")}
        onOpenPersonalization={() => setCurrentPage("personalization")}
        onOpenTheme={() => setCurrentPage("theme")}
        onOpenQuoteSettings={() => setCurrentPage("quote-settings")}
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
        quoteFont={quoteFont}
        quoteFontSize={quoteFontSize}
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
          void shareAsImage();
        }}
      />

      {/* 用于生成分享截图，不在屏幕中显示 */}
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
