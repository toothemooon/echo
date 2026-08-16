import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  Animated,
  Alert,
  Appearance,
  useWindowDimensions,
} from "react-native";
import Constants from "expo-constants";
import { StatusBar } from "expo-status-bar";
import { captureRef } from "react-native-view-shot";
import { formatQuoteShareText } from "../services/shareQuote";
import {
  useFonts,
  CormorantGaramond_400Regular_Italic,
} from "@expo-google-fonts/cormorant-garamond";

import SplashScreen from "../components/common/SplashScreen";
import { COLORS, HIGH_CONTRAST_COLORS } from "../constants/colors";
import {
  CATEGORIES,
  categoriesForMood,
  moodSummary,
  type Category,
  type MoodPreference,
} from "../constants/categories";
import { type Quote } from "../data/quotes";

import {
  getPreferredCategories,
  setPreferredCategories as savePreferredCategories,
  getTheme,
  setTheme,
  getQuoteFont,
  setQuoteFont,
  getQuoteFontSize,
  setQuoteFontSize,
  getQuoteAnimation,
  setQuoteAnimation,
  getQuoteLanguage,
  setQuoteLanguage,
  getMoodPreference,
  setMoodPreference,
  getOnboardingComplete,
  setOnboardingComplete,
  getHighContrast,
  setHighContrast,
  type QuoteFont,
  type QuoteFontSize,
  type QuoteAnimation,
  type QuoteLanguagePreference,
  type ThemeMode,
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
import ArchiveBackground from "../components/common/ArchiveBackground";
import AnimationSettingsScreen from "../screens/AnimationSettingsScreen";
import LanguageSettingsScreen from "../screens/LanguageSettingsScreen";
import OnboardingScreen from "../screens/OnboardingScreen";
import QuoteContextScreen from "../screens/QuoteContextScreen";
import AccessibilityScreen from "../screens/AccessibilityScreen";
import ContentSourcesScreen from "../screens/ContentSourcesScreen";
import { syncAppIconWithTheme } from "../services/appIcon";
import { getNextRecommendedQuote } from "../storage/quoteRotation";
import {
  clearViewedQuotes,
  getViewedQuotes,
  recordViewedQuote,
  type ViewedQuoteRecord,
} from "../storage/viewedQuotes";
import { clearLocalData } from "../storage/clearLocalData";

type Page =
  | "home"
  | "quote-context"
  | "settings"
  | "theme"
  | "personalization"
  | "quote-settings"
  | "language-settings"
  | "animation-settings"
  | "accessibility"
  | "content-sources";

export default function Index() {
  const { height: screenHeight } = useWindowDimensions();
  const [fontsLoaded] = useFonts({
    CormorantGaramond_400Regular_Italic,
  });

  // ── 跨页面 State ──
  const [currentPage, setCurrentPage] = useState<Page>("home");
  const [theme, setThemeState] = useState<ThemeMode>("light");
  const isDark = theme === "dark";

  const [preferredCategories, setPreferredCategories] = useState<Category[]>([
    ...CATEGORIES,
  ]);
  const [mood, setMood] = useState<MoodPreference>("surprise");
  const [onboardingComplete, setOnboardingCompleteState] = useState(false);

  const [savedQuotes, setSavedQuotes] = useState<Quote[]>([]);
  const [viewedQuotes, setViewedQuotes] = useState<ViewedQuoteRecord[]>([]);

  const [quoteFont, setQuoteFontState] = useState<QuoteFont>("elegant");

  const [quoteFontSize, setQuoteFontSizeState] =
    useState<QuoteFontSize>("medium");

  const [quoteAnimation, setQuoteAnimationState] =
    useState<QuoteAnimation>("horizontal");

  const [quoteLanguage, setQuoteLanguageState] =
    useState<QuoteLanguagePreference>("en");

  const [initializationReady, setInitializationReady] = useState(false);
  const [highContrast, setHighContrastState] = useState(false);
  const [retryingQuote, setRetryingQuote] = useState(false);
  const [isBookmarkBusy, setIsBookmarkBusy] = useState(false);

  // ── Home State ──
  const [quoteHistory, setQuoteHistory] = useState<Quote[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [shareVisible, setShareVisible] = useState(false);
  const [contextQuote, setContextQuote] = useState<Quote | null>(null);

  // ── Splash Screen State ──
  const [showSplash, setShowSplash] = useState(true);

  // ── 动画和组件引用 ──
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const sheetAnim = useRef(new Animated.Value(screenHeight)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const isAnimating = useRef(false);
  const isSelectingQuote = useRef(false);
  // Bumped every time the quote history is replaced wholesale (language or
  // mood change, retry, clear-all). An in-flight quote selection captures
  // the generation it started under and discards its result when the
  // history has been rebuilt in the meantime.
  const historyGeneration = useRef(0);
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
          savedQuoteAnimation,
          savedQuoteLanguage,
          savedMood,
          savedOnboardingComplete,
          savedHighContrast,
          savedViewedQuotes,
        ] = await Promise.all([
          getTheme(),
          getPreferredCategories(),
          getSavedQuotes(),
          getQuoteFont(),
          getQuoteFontSize(),
          getQuoteAnimation(),
          getQuoteLanguage(),
          getMoodPreference(),
          getOnboardingComplete(),
          getHighContrast(),
          getViewedQuotes(),
        ]);

        const resolvedTheme: ThemeMode =
          savedTheme ??
          (Appearance.getColorScheme() === "dark" ? "dark" : "light");

        setThemeState(resolvedTheme);
        void syncAppIconWithTheme(resolvedTheme).catch((error) => {
          if (__DEV__) {
            console.warn(
              "Failed to synchronize the app icon.",
              error instanceof Error ? error.message : "Unknown error",
            );
          }
        });
        setPreferredCategories(prefs);
        setMood(savedMood);
        setOnboardingCompleteState(savedOnboardingComplete);
        setSavedQuotes(savedRecords.map((record) => record.quote));
        setQuoteFontState(savedQuoteFont);
        setQuoteFontSizeState(savedQuoteFontSize);
        setQuoteAnimationState(savedQuoteAnimation);
        setQuoteLanguageState(savedQuoteLanguage);
        setHighContrastState(savedHighContrast);
        setViewedQuotes(savedViewedQuotes);

        const firstQuote = savedOnboardingComplete
          ? await getNextRecommendedQuote(prefs, [], savedQuoteLanguage)
          : null;

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

  useEffect(() => {
    if (!historyVisible) {
      sheetAnim.setValue(screenHeight);
    }
  }, [historyVisible, screenHeight, sheetAnim]);

  // ── 派生值 ──
  const currentQuote = quoteHistory[historyIndex] ?? null;

  useEffect(() => {
    if (!currentQuote) return;
    void recordViewedQuote(currentQuote)
      .then(() => getViewedQuotes())
      .then(setViewedQuotes)
      .catch(() => undefined);
  }, [currentQuote?.id]);

  // ── 启动页 ──
  if (!fontsLoaded || !initializationReady || showSplash) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: COLORS[theme].background,
        }}
      >
        <SplashScreen
          theme={theme}
          onAnimationComplete={() => setShowSplash(false)}
        />
      </View>
    );
  }

  const colors = highContrast && theme !== "archive"
    ? HIGH_CONTRAST_COLORS[theme]
    : COLORS[theme];

  if (!onboardingComplete) {
    return (
      <OnboardingScreen
        colors={colors}
        theme={theme}
        onSelect={(nextMood) => {
          void changeMood(nextMood, true);
        }}
      />
    );
  }

  if (!currentQuote) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          alignItems: "center",
          justifyContent: "center",
          padding: 32,
        }}
      >
        <Text style={{ color: colors.text, fontSize: 22, textAlign: "center" }}>
          No quote is available right now.
        </Text>
        <Text
          style={{
            color: colors.author,
            fontSize: 15,
            lineHeight: 22,
            textAlign: "center",
            marginTop: 10,
          }}
        >
          Your saved preferences are safe. Try loading the local catalog again.
        </Text>
        <Pressable
          style={{
            marginTop: 24,
            paddingHorizontal: 22,
            paddingVertical: 13,
            borderRadius: 22,
            backgroundColor: colors.btnBg,
          }}
          disabled={retryingQuote}
          onPress={() => {
            setRetryingQuote(true);
            void getNextRecommendedQuote(preferredCategories, [], quoteLanguage)
              .then((quote) => {
                if (quote) {
                  historyGeneration.current += 1;
                  setQuoteHistory([quote]);
                  setHistoryIndex(0);
                }
              })
              .finally(() => setRetryingQuote(false));
          }}
          accessibilityRole="button"
          accessibilityLabel="Try loading a quote again"
        >
          <Text style={{ color: colors.text, fontSize: 15 }}>
            {retryingQuote ? "Loading…" : "Try Again"}
          </Text>
        </Pressable>
      </View>
    );
  }

  const isSaved = savedQuotes.some((quote) => quote.id === currentQuote.id);

  const canGoPrev = historyIndex > 0;

  // ── 主题 ──
  const changeTheme = (nextTheme: ThemeMode) => {
    setThemeState(nextTheme);

    void setTheme(nextTheme).catch(() => {
      if (__DEV__) {
        console.warn("Failed to save theme.");
      }
    });

    void syncAppIconWithTheme(nextTheme).catch((error) => {
      if (__DEV__) {
        console.warn(
          "Failed to synchronize the app icon.",
          error instanceof Error ? error.message : "Unknown error",
        );
      }
    });
  };

  const toggleTheme = () => {
    changeTheme(theme === "dark" ? "light" : "dark");
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

  const changeQuoteAnimation = (animation: QuoteAnimation) => {
    setQuoteAnimationState(animation);

    void setQuoteAnimation(animation).catch(() => {
      if (__DEV__) {
        console.warn("Failed to save quote animation.");
      }
    });
  };

  async function changeQuoteLanguage(
    nextLanguage: QuoteLanguagePreference,
  ) {
    setQuoteLanguageState(nextLanguage);

    // Invalidate any in-flight quote selection so its result cannot be
    // appended to the new history later.
    const generation = historyGeneration.current + 1;
    historyGeneration.current = generation;

    try {
      await setQuoteLanguage(nextLanguage);
      const firstMatchingQuote = await getNextRecommendedQuote(
        preferredCategories,
        [],
        nextLanguage,
      );

      if (firstMatchingQuote && historyGeneration.current === generation) {
        setQuoteHistory([firstMatchingQuote]);
        setHistoryIndex(0);
      }
    } catch {
      if (__DEV__) {
        console.warn("Failed to change quote language.");
      }
    }
  }

  // ── 阅读偏好 ──
  async function changeMood(
    nextMood: MoodPreference,
    completeOnboarding = false,
  ) {
    const nextCategories = categoriesForMood(nextMood);
    setMood(nextMood);
    setPreferredCategories(nextCategories);

    // Invalidate any in-flight quote selection so its result cannot be
    // appended to the new history later.
    const generation = historyGeneration.current + 1;
    historyGeneration.current = generation;

    try {
      await Promise.all([
        setMoodPreference(nextMood),
        savePreferredCategories(nextCategories),
        ...(completeOnboarding ? [setOnboardingComplete(true)] : []),
      ]);
      const firstMatchingQuote = await getNextRecommendedQuote(
        nextCategories,
        [],
        quoteLanguage,
      );
      if (firstMatchingQuote && historyGeneration.current === generation) {
        setQuoteHistory([firstMatchingQuote]);
        setHistoryIndex(0);
      }
      if (completeOnboarding) {
        setOnboardingCompleteState(true);
      }
    } catch {
      if (__DEV__) {
        console.warn("Failed to save reading preference.");
      }
    }
  }

  // ── 收藏 ──
  const toggleBookmark = async () => {
    if (isBookmarkBusy) return;
    setIsBookmarkBusy(true);
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
    } finally {
      setIsBookmarkBusy(false);
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
        message: formatQuoteShareText(currentQuote),
      });
      return true;
    } catch (_error) {
      Alert.alert("Error", "Failed to generate image.");
      return false;
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

    if (quoteAnimation === "none") {
      updateQuote();
      fadeAnim.setValue(1);
      slideAnim.setValue(0);
      isAnimating.current = false;
      return;
    }

    const offset =
      quoteAnimation === "horizontal"
        ? direction === "left"
          ? -60
          : 60
        : 0;

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
  const goNext = async () => {
    if (isAnimating.current || isSelectingQuote.current) {
      return;
    }

    const canGoNext = historyIndex < quoteHistory.length - 1;

    if (canGoNext) {
      runQuoteTransition("right", () => {
        setHistoryIndex((previous) => previous + 1);
      });

      return;
    }

    isSelectingQuote.current = true;
    const generation = historyGeneration.current;
    const newQuote = await getNextRecommendedQuote(
      preferredCategories,
      quoteHistory,
      quoteLanguage,
    ).finally(() => {
      isSelectingQuote.current = false;
    });

    if (!newQuote) {
      return;
    }

    // A language/mood change or data reset that happened while the quote
    // was being selected must not append this stale quote to the new
    // history.
    if (historyGeneration.current !== generation) {
      return;
    }

    runQuoteTransition("right", () => {
      setQuoteHistory((previous) => [...previous, newQuote]);

      setHistoryIndex((previous) => previous + 1);
    });
  };

  // ── 上一条名言 ──
  const goPrev = () => {
    if (isAnimating.current || isSelectingQuote.current) {
      return;
    }

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
        toValue: screenHeight,
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

  const openQuoteContext = (quote: Quote) => {
    setContextQuote(quote);
    setCurrentPage("quote-context");
  };

  const clearAllData = async () => {
    try {
      historyGeneration.current += 1;
      await clearViewedQuotes();
      await clearLocalData();
      setThemeState("light");
      setPreferredCategories([...CATEGORIES]);
      setMood("surprise");
      setOnboardingCompleteState(false);
      setSavedQuotes([]);
      setViewedQuotes([]);
      setQuoteFontState("elegant");
      setQuoteFontSizeState("medium");
      setQuoteAnimationState("horizontal");
      setQuoteLanguageState("en");
      setHighContrastState(false);
      setQuoteHistory([]);
      setHistoryIndex(-1);
      setHistoryVisible(false);
      setShareVisible(false);
      setContextQuote(null);
      setCurrentPage("home");
      await syncAppIconWithTheme("light");
    } catch {
      Alert.alert("Unable to clear data", "Your local data was not changed. Please try again.");
    }
  };

  if (currentPage === "quote-context" && contextQuote) {
    return (
      <QuoteContextScreen
        quote={contextQuote}
        colors={colors}
        theme={theme}
        onBack={() => {
          setContextQuote(null);
          setCurrentPage("home");
        }}
      />
    );
  }

  // ── Theme 页面 ──
  if (currentPage === "theme") {
    return (
      <ThemeScreen
        colors={colors}
        theme={theme}
        onChangeTheme={changeTheme}
        onBack={() => setCurrentPage("settings")}
      />
    );
  }

  // ── Personalization 页面 ──
  if (currentPage === "personalization") {
    return (
      <PersonalizationScreen
        colors={colors}
        theme={theme}
        mood={mood}
        onChangeMood={(nextMood) => {
          void changeMood(nextMood);
        }}
        onBack={() => setCurrentPage("settings")}
      />
    );
  }

  // ── Quote Settings 页面 ──
  if (currentPage === "quote-settings") {
    return (
      <QuoteSettingsScreen
        colors={colors}
        theme={theme}
        quoteFont={quoteFont}
        quoteFontSize={quoteFontSize}
        onChangeQuoteFont={changeQuoteFont}
        onChangeQuoteFontSize={changeQuoteFontSize}
        onBack={() => setCurrentPage("settings")}
      />
    );
  }

  // ── Language Settings 页面 ──
  if (currentPage === "language-settings") {
    return (
      <LanguageSettingsScreen
        colors={colors}
        theme={theme}
        language={quoteLanguage}
        onChangeLanguage={(nextLanguage) => {
          void changeQuoteLanguage(nextLanguage);
        }}
        onBack={() => setCurrentPage("settings")}
      />
    );
  }

  // ── Animation Settings 页面 ──
  if (currentPage === "animation-settings") {
    return (
      <AnimationSettingsScreen
        colors={colors}
        theme={theme}
        animation={quoteAnimation}
        onChangeAnimation={changeQuoteAnimation}
        onBack={() => setCurrentPage("settings")}
      />
    );
  }

  if (currentPage === "accessibility") {
    return (
      <AccessibilityScreen
        colors={colors}
        theme={theme}
        highContrast={highContrast}
        onChangeHighContrast={(value) => {
          setHighContrastState(value);
          void setHighContrast(value).catch(() => {
            setHighContrastState((current) => !current);
          });
        }}
        onBack={() => setCurrentPage("settings")}
      />
    );
  }

  if (currentPage === "content-sources") {
    return (
      <ContentSourcesScreen
        colors={colors}
        theme={theme}
        onBack={() => setCurrentPage("settings")}
      />
    );
  }

  // ── Settings 页面 ──
  if (currentPage === "settings") {
    return (
      <SettingsScreen
        colors={colors}
        theme={theme}
        onBack={() => setCurrentPage("home")}
        onOpenPersonalization={() => setCurrentPage("personalization")}
        onOpenTheme={() => setCurrentPage("theme")}
        onOpenQuoteSettings={() => setCurrentPage("quote-settings")}
        onOpenLanguageSettings={() => setCurrentPage("language-settings")}
        onOpenAnimationSettings={() => setCurrentPage("animation-settings")}
        onOpenAccessibility={() => setCurrentPage("accessibility")}
        onOpenContentSources={() => setCurrentPage("content-sources")}
        onClearData={clearAllData}
        quoteLanguage={quoteLanguage}
        quoteAnimation={quoteAnimation}
        preferenceSummary={moodSummary(mood)}
        appVersion={Constants.nativeApplicationVersion ?? Constants.expoConfig?.version ?? "1.0.0"}
        buildVersion={Constants.nativeBuildVersion ?? "1"}
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
      <ArchiveBackground theme={theme} />
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
        onPressAuthor={() => openQuoteContext(currentQuote)}
      />

      <View style={{ alignItems: "center" }}>
      <ActionBar
        colors={colors}
        isSaved={isSaved}
        isBookmarkBusy={isBookmarkBusy}
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
        viewedQuotes={viewedQuotes}
        colors={colors}
        sheetAnim={sheetAnim}
        backdropAnim={backdropAnim}
        onClose={closeHistory}
        onRemoveSaved={handleRemoveSaved}
        onClearHistory={() => {
          void clearViewedQuotes()
            .then(() => setViewedQuotes([]))
            .catch(() => Alert.alert("Unable to clear history", "Please try again."));
        }}
      />

      <ShareSheet
        visible={shareVisible}
        quote={currentQuote}
        colors={colors}
        onClose={() => setShareVisible(false)}
        onShareAsImage={shareAsImage}
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
