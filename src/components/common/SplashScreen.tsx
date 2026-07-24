import React, { useEffect, useRef } from "react";
import {
  Animated,
  Image,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { COLORS } from "../../constants/colors";
import type { ThemeMode } from "../../storage/preferences";

interface SplashScreenProps {
  theme: ThemeMode;
  onAnimationComplete: () => void;
}

const SPLASH_IMAGES = {
  light: require("../../../assets/echo-icon-light.png"),
  dark: require("../../../assets/echo-icon-dark.png"),
  archive: require("../../../assets/echo-icon-archive.png"),
} as const;

export default function SplashScreen({
  theme,
  onAnimationComplete,
}: SplashScreenProps) {
  const { width, height } = useWindowDimensions();
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const echoProgress = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const containerOpacity = useRef(new Animated.Value(1)).current;

  const colors = COLORS[theme];
  const splashImage = SPLASH_IMAGES[theme];

  useEffect(() => {
    // Logo fade in and scale up
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(echoProgress, {
          toValue: 1,
          duration: 1100,
          useNativeDriver: true,
        }),
      ]),
      // Text fade in
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      // Hold for a moment
      Animated.delay(400),
      // Fade out everything
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onAnimationComplete();
    });
  }, []);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: containerOpacity,
          backgroundColor: colors.background,
          width,
          height,
        },
      ]}
    >
      <View style={styles.content}>
        {/* Logo */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <Animated.Image
            source={splashImage}
            style={[
              styles.logo,
              { width: width * 0.68, height: width * 0.68 },
              styles.echoLayer,
              {
                opacity: echoProgress.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0, 0.16, 0],
                }),
                transform: [
                  {
                    translateX: echoProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [30, 0],
                    }),
                  },
                ],
              },
            ]}
            resizeMode="contain"
          />

          <Animated.Image
            source={splashImage}
            style={[
              styles.logo,
              { width: width * 0.68, height: width * 0.68 },
              styles.echoLayer,
              {
                opacity: echoProgress.interpolate({
                  inputRange: [0, 0.55, 1],
                  outputRange: [0, 0.28, 0],
                }),
                transform: [
                  {
                    translateX: echoProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [15, 0],
                    }),
                  },
                ],
              },
            ]}
            resizeMode="contain"
          />

          <Image
            source={splashImage}
            style={[
              styles.logo,
              { width: width * 0.68, height: width * 0.68 },
            ]}
            resizeMode="contain"
          />
        </Animated.View>

        {/* App Name */}
        <Animated.View style={{ opacity: textOpacity }}>
          <View style={styles.textContainer}>
            <Text style={[styles.tagline, { color: colors.author }]}>
              WORDS OUTLIVE THEIR MOMENT
            </Text>
            <View style={styles.echoDots}>
              <View style={[styles.dot, { backgroundColor: colors.dot }]} />
              <View
                style={[
                  styles.dot,
                  { backgroundColor: colors.dot, opacity: 0.6 },
                ]}
              />
              <View
                style={[
                  styles.dot,
                  { backgroundColor: colors.dot, opacity: 0.3 },
                ]}
              />
            </View>
          </View>
        </Animated.View>
      </View>

      {/* Bottom accent line */}
      <View style={styles.bottomAccent}>
        <View
          style={[
            styles.accentLine,
            { backgroundColor: colors.dot, opacity: 0.3 },
          ]}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 9999,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    maxHeight: 340,
    maxWidth: 340,
    borderRadius: 36,
  },
  echoLayer: {
    position: "absolute",
  },
  textContainer: {
    marginTop: 24,
    alignItems: "center",
  },
  tagline: {
    fontSize: 10,
    fontWeight: "500",
    letterSpacing: 2.8,
  },
  echoDots: {
    flexDirection: "row",
    marginTop: 14,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  bottomAccent: {
    position: "absolute",
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  accentLine: {
    width: 40,
    height: 3,
    borderRadius: 1.5,
  },
});
