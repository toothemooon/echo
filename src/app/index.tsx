import { useState, useEffect, useRef } from "react";
import {
  View,
  Animated,
  Alert,
  Appearance,
  AppState,
  useWindowDimensions,
} from "react-native";
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
import NotificationPrimerSheet from "../components/home/NotificationPrimerSheet";

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
import NotificationSettingsScreen from "../screens/NotificationSettingsScreen";
import { syncAppIconWithTheme } from "../services/appIcon";
import { getNextRecommendedQuote } from "../storage/quoteRotation";
import {
  addDailyReminderResponseListener,
  cancelDailyReminder,
  configureNotificationChannel,
  getNotificationPermissionState,
  openSystemNotificationSettings,
  requestNotificationPermission,
  scheduleDailyReminder,
  scheduleDevelopmentTestNotification,
} from "../services/notifications";
import {
  getNotificationPreferences,
  setNotificationPreferences,
} from "../storage/notificationPreferences";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  recordQuoteViewed,
  shouldShowNotificationPrimer,
  type NotificationPermissionState,
  type NotificationPreferences,
  type ReminderTime,
} from "../notifications/model";
import {
  disableReminder,
  enableReminder,
  rescheduleReminder,
  rescheduleReminderLanguage,
} from "../notifications/lifecycle";

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
  | "notification-settings";

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

  const [quoteFont, setQuoteFontState] = useState<QuoteFont>("elegant");

  const [quoteFontSize, setQuoteFontSizeState] =
    useState<QuoteFontSize>("medium");

  const [quoteAnimation, setQuoteAnimationState] =
    useState<QuoteAnimation>("horizontal");

  const [quoteLanguage, setQuoteLanguageState] =
    useState<QuoteLanguagePreference>("en");

  const [initializationReady, setInitializationReady] = useState(false);
  const [highContrast, setHighContrastState] = useState(false);
  const [notificationPreferences, setNotificationPreferencesState] =
    useState<NotificationPreferences>(DEFAULT_NOTIFICATION_PREFERENCES);
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermissionState>("undetermined");
  const [notificationBusy, setNotificationBusy] = useState(false);
  const [notificationPrimerVisible, setNotificationPrimerVisible] =
    useState(false);

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
          savedNotificationPreferences,
          savedNotificationPermission,
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
          getNotificationPreferences(),
          getNotificationPermissionState(),
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
        const reconciledNotificationPreferences = {
          ...savedNotificationPreferences,
          enabled:
            savedNotificationPreferences.enabled &&
            savedNotificationPermission === "authorized",
        };
        setNotificationPreferencesState(reconciledNotificationPreferences);
        setNotificationPermission(savedNotificationPermission);
        if (
          reconciledNotificationPreferences.enabled !==
          savedNotificationPreferences.enabled
        ) {
          await setNotificationPreferences(reconciledNotificationPreferences);
        }
        await configureNotificationChannel();

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
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void getNotificationPermissionState()
          .then((permission) => {
            setNotificationPermission(permission);
            if (
              permission !== "authorized" &&
              notificationPreferences.enabled
            ) {
              const next = {
                ...notificationPreferences,
                enabled: false,
              };
              setNotificationPreferencesState(next);
              void setNotificationPreferences(next);
            }
          })
          .catch(() => undefined);
      }
    });
    return () => subscription.remove();
  }, [notificationPreferences]);

  useEffect(() => {
    const subscription = addDailyReminderResponseListener(() => {
      setHistoryVisible(false);
      setShareVisible(false);
      setNotificationPrimerVisible(false);
      setCurrentPage("home");
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!historyVisible) {
      sheetAnim.setValue(screenHeight);
    }
  }, [historyVisible, screenHeight, sheetAnim]);

  // ── 派生值 ──
  const currentQuote = quoteHistory[historyIndex] ?? null;

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

  const colors = highContrast
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
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
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

  async function persistNotificationPreferences(
    next: NotificationPreferences,
  ) {
    setNotificationPreferencesState(next);
    await setNotificationPreferences(next);
  }

  async function enableDailyReminder() {
    if (notificationBusy) return;
    setNotificationBusy(true);
    try {
      const permission = await requestNotificationPermission();
      setNotificationPermission(permission);
      const next = await enableReminder(
        notificationPreferences,
        quoteLanguage,
        async () => permission,
        scheduleDailyReminder,
      );
      await persistNotificationPreferences(next);
      if (!next.enabled) {
        setNotificationPrimerVisible(false);
        Alert.alert(
          "Notifications are off",
          "You can enable notifications later from ECHO Settings or iOS Settings.",
        );
        return;
      }
      setNotificationPrimerVisible(false);
    } catch {
      Alert.alert(
        "Unable to schedule reminder",
        "Your previous reminder has been left unchanged. Please try again.",
      );
    } finally {
      setNotificationBusy(false);
    }
  }

  async function disableDailyReminder() {
    if (notificationBusy) return;
    setNotificationBusy(true);
    try {
      const next = await disableReminder(
        notificationPreferences,
        cancelDailyReminder,
      );
      await persistNotificationPreferences(next);
    } catch {
      Alert.alert("Unable to turn off reminder", "Please try again.");
    } finally {
      setNotificationBusy(false);
    }
  }

  async function changeReminderTime(time: ReminderTime) {
    if (
      notificationBusy ||
      !notificationPreferences.enabled ||
      time === notificationPreferences.time
    ) {
      return;
    }
    setNotificationBusy(true);
    try {
      const next = await rescheduleReminder(
        notificationPreferences,
        time,
        quoteLanguage,
        scheduleDailyReminder,
      );
      await persistNotificationPreferences(next);
    } catch {
      Alert.alert(
        "Unable to change reminder",
        "The previous reminder time is still active.",
      );
    } finally {
      setNotificationBusy(false);
    }
  }

  async function dismissNotificationPrimer() {
    const next = { ...notificationPreferences, primerShown: true };
    setNotificationPrimerVisible(false);
    await persistNotificationPreferences(next);
  }

  async function recordNotificationEngagement() {
    if (
      notificationPreferences.enabled ||
      notificationPreferences.primerShown ||
      notificationPreferences.quotesViewed >= 3
    ) {
      return;
    }
    const next = recordQuoteViewed(notificationPreferences);
    await persistNotificationPreferences(next);
    if (shouldShowNotificationPrimer(next, onboardingComplete)) {
      setNotificationPrimerVisible(true);
    }
  }

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

    try {
      await setQuoteLanguage(nextLanguage);
      const firstMatchingQuote = await getNextRecommendedQuote(
        preferredCategories,
        [],
        nextLanguage,
      );

      if (firstMatchingQuote) {
        setQuoteHistory([firstMatchingQuote]);
        setHistoryIndex(0);
      }
      if (notificationPreferences.enabled) {
        try {
          const next = await rescheduleReminderLanguage(
            notificationPreferences,
            nextLanguage,
            scheduleDailyReminder,
          );
          await persistNotificationPreferences(next);
        } catch {
          if (__DEV__) {
            console.warn("Failed to update reminder language.");
          }
        }
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
      if (firstMatchingQuote) {
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
      void recordNotificationEngagement();

      return;
    }

    isSelectingQuote.current = true;
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

    runQuoteTransition("right", () => {
      setQuoteHistory((previous) => [...previous, newQuote]);

      setHistoryIndex((previous) => previous + 1);
    });
    void recordNotificationEngagement();
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

  if (currentPage === "notification-settings") {
    return (
      <NotificationSettingsScreen
        colors={colors}
        theme={theme}
        enabled={notificationPreferences.enabled}
        time={notificationPreferences.time}
        permission={notificationPermission}
        busy={notificationBusy}
        onToggle={(enabled) => {
          void (enabled ? enableDailyReminder() : disableDailyReminder());
        }}
        onChangeTime={(time) => {
          void changeReminderTime(time);
        }}
        onOpenSystemSettings={() => {
          void openSystemNotificationSettings();
        }}
        onTestNotification={() => {
          void scheduleDevelopmentTestNotification()
            .then(() => {
              Alert.alert("Test scheduled", "A notification will appear in 60 seconds.");
            })
            .catch(() => {
              Alert.alert("Unable to schedule test", "Check notification permission.");
            });
        }}
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
        onOpenNotifications={() => setCurrentPage("notification-settings")}
        notificationsEnabled={notificationPreferences.enabled}
        notificationTime={notificationPreferences.time}
        quoteLanguage={quoteLanguage}
        quoteAnimation={quoteAnimation}
        preferenceSummary={moodSummary(mood)}
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
        onShareAsImage={shareAsImage}
      />

      <NotificationPrimerSheet
        visible={notificationPrimerVisible}
        colors={colors}
        onEnable={() => {
          void enableDailyReminder();
        }}
        onNotNow={() => {
          void dismissNotificationPrimer();
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
