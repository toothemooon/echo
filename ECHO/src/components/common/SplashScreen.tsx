import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, Image, StyleSheet, View } from "react-native";
import { COLORS } from "../../constants/colors";

interface SplashScreenProps {
  isDark: boolean;
  onAnimationComplete: () => void;
}

const { width, height } = Dimensions.get("window");

export default function SplashScreen({
  isDark,
  onAnimationComplete,
}: SplashScreenProps) {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const containerOpacity = useRef(new Animated.Value(1)).current;

  const bgColor = isDark ? COLORS.dark.background : COLORS.light.background;
  const brandColor = "#8FAE8B";

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
        { opacity: containerOpacity, backgroundColor: bgColor },
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
          <Image
            source={require("../../../assets/splash-icon.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        {/* App Name */}
        <Animated.View style={{ opacity: textOpacity }}>
          <View style={styles.textContainer}>
            <View style={[styles.dot, { backgroundColor: brandColor }]} />
            <View
              style={[
                styles.dot,
                { backgroundColor: brandColor, opacity: 0.6 },
              ]}
            />
            <View
              style={[
                styles.dot,
                { backgroundColor: brandColor, opacity: 0.3 },
              ]}
            />
          </View>
        </Animated.View>
      </View>

      {/* Bottom accent line */}
      <View style={styles.bottomAccent}>
        <View
          style={[
            styles.accentLine,
            { backgroundColor: brandColor, opacity: 0.3 },
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
    width,
    height,
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
    width: width * 0.4,
    height: width * 0.4,
    maxHeight: 200,
    maxWidth: 200,
  },
  textContainer: {
    flexDirection: "row",
    marginTop: 24,
    alignItems: "center",
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
