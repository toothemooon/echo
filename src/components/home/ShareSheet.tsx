import { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  AccessibilityInfo,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { setStringAsync } from "expo-clipboard";
import { COLORS } from "../../constants/colors";
import type { Quote } from "../../data/quotes";
import {
  formatQuoteShareText,
  getShareCopy,
} from "../../services/shareQuote";

type Props = {
  visible: boolean;
  quote: Quote;
  colors: typeof COLORS.light;
  onClose: () => void;
  onShareAsImage: () => Promise<boolean>;
};

export default function ShareSheet(props: Props) {
  const { height } = useWindowDimensions();
  const [copied, setCopied] = useState(false);
  const [isSharingImage, setIsSharingImage] = useState(false);
  
  const copy = getShareCopy(props.quote.language);
  const shareText = formatQuoteShareText(props.quote);

  useEffect(() => {
    if (!props.visible) {
      setCopied(false);
      setIsSharingImage(false);
      
    }
  }, [props.visible]);

  if (!props.visible) return null;

  const handleCopyText = async () => {
    try {
      await setStringAsync(shareText);
      setCopied(true);
      AccessibilityInfo.announceForAccessibility(copy.copied);
    } catch {
      // Clipboard failures should not interrupt the reading experience.
    }
  };

  const handleImageShare = async () => {
    if (isSharingImage) return;
    setIsSharingImage(true);
    const shared = await props.onShareAsImage();
    setIsSharingImage(false);
    if (shared) props.onClose();
  };

  

  const options = [
    {
      icon: copied ? ("checkmark-circle-outline" as const) : ("copy-outline" as const),
      label: copied ? copy.copied : copy.copy,
      onPress: handleCopyText,
      busy: false,
    },
    {
      icon: "image-outline" as const,
      label: copy.image,
      onPress: handleImageShare,
      busy: isSharingImage,
    },
  ];

  return (
    <View
      style={StyleSheet.absoluteFill}
      accessibilityViewIsModal
      importantForAccessibility="yes"
    >
      <Pressable
        style={styles.backdrop}
        onPress={props.onClose}
        accessibilityRole="button"
        accessibilityLabel={copy.close}
      />

      <View
        style={[
          styles.sheet,
          {
            backgroundColor: props.colors.sheetBg,
            maxHeight: height * 0.86,
          },
        ]}
      >
        <View style={styles.handleContainer}>
          <View style={[styles.handle, { backgroundColor: props.colors.sheetHandle }]} />
        </View>

        <View style={styles.sheetHeader}>
          <Text
            style={[
              styles.sheetTitle,
              {
                color: props.colors.sheetTitle,
                fontFamily:
                  props.quote.language === "en"
                    ? "CormorantGaramond_400Regular_Italic"
                    : undefined,
              },
            ]}
          >
            {copy.title}
          </Text>
          <Pressable
            style={styles.closeButton}
            onPress={props.onClose}
            accessibilityRole="button"
            accessibilityLabel={copy.close}
            hitSlop={8}
          >
            <Ionicons name="close" size={24} color={props.colors.btnIcon} />
          </Pressable>
        </View>

        <View style={[styles.sheetDivider, { backgroundColor: props.colors.divider }]} />

        <View style={[styles.preview, { backgroundColor: props.colors.background }]}>
          <ScrollView
            style={{ maxHeight: Math.min(210, height * 0.28) }}
            showsVerticalScrollIndicator={props.quote.text.length > 140}
            nestedScrollEnabled
          >
            <Text
              style={[
                styles.previewText,
                {
                  color: props.colors.text,
                  fontFamily:
                    props.quote.language === "en"
                      ? "CormorantGaramond_400Regular_Italic"
                      : undefined,
                  fontStyle: props.quote.language === "en" ? "italic" : "normal",
                },
              ]}
            >
              “{props.quote.text}”
            </Text>
          </ScrollView>
          <Text style={[styles.previewAuthor, { color: props.colors.author }]}>
            — {props.quote.author}
          </Text>
        </View>

        <View style={styles.optionsList}>
          {options.map((option) => (
            <Pressable
              key={option.label}
              style={[styles.optionRow, { backgroundColor: props.colors.btnBg }]}
              onPress={() => {
                void option.onPress();
              }}
              disabled={option.busy}
              accessibilityRole="button"
              accessibilityLabel={option.label}
              accessibilityState={{ busy: option.busy, disabled: option.busy }}
            >
              <View style={styles.optionLeft}>
                {option.busy ? (
                  <ActivityIndicator size="small" color={props.colors.btnIcon} />
                ) : (
                  <Ionicons name={option.icon} size={22} color={props.colors.btnIcon} />
                )}
                <Text style={[styles.optionLabel, { color: props.colors.text }]}>
                  {option.label}
                </Text>
              </View>
              {!option.busy ? (
                <Ionicons name="chevron-forward" size={16} color={props.colors.btnIcon} />
              ) : null}
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: "#000", opacity: 0.45 },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34,
  },
  handleContainer: { alignItems: "center", paddingTop: 10, paddingBottom: 6 },
  handle: { width: 36, height: 4, borderRadius: 2 },
  sheetHeader: {
    minHeight: 60,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  sheetTitle: { flex: 1, flexShrink: 1, fontSize: 26, fontWeight: "600" },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetDivider: { height: StyleSheet.hairlineWidth, marginHorizontal: 24 },
  preview: { marginHorizontal: 24, marginTop: 16, borderRadius: 16, padding: 20 },
  previewText: { fontSize: 18, lineHeight: 27, marginBottom: 8 },
  previewAuthor: { marginTop: 8, fontSize: 14, lineHeight: 21, textAlign: "right" },
  optionsList: { marginTop: 16, paddingHorizontal: 24, gap: 8 },
  optionRow: {
    minHeight: 58,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  optionLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  optionLabel: { flexShrink: 1, fontSize: 16, lineHeight: 22 },
});
