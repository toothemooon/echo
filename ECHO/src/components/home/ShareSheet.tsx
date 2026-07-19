import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  ScrollView,
  Share,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { setStringAsync } from "expo-clipboard";
import * as Linking from "expo-linking";
import { COLORS } from "../../constants/colors";
import { Quote } from "../../database/quotes";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

// ══════════════════════════════════════════════
//  ShareSheet — 分享选项底部弹窗
//  提供复制文字、分享图片、系统分享、Twitter、WhatsApp
// ══════════════════════════════════════════════

// ── Props ──
type ShareSheetProps = {
  visible: boolean;
  quote: Quote;
  colors: (typeof COLORS)["light"];
  onClose: () => void;
  onShareAsImage: () => void;
};

export default function ShareSheet(props: ShareSheetProps) {
  // ── 未显示时直接返回 ──
  if (!props.visible) return null;

  const shareText = `"${props.quote.text}"\n— ${props.quote.author}\n\nShared from Echo`;

  const handleCopyText = async () => {
    await setStringAsync(shareText);
  };

  const handleTwitter = () => {
    const encoded = encodeURIComponent(shareText);
    Linking.openURL(`https://twitter.com/intent/tweet?text=${encoded}`);
  };

  const handleWhatsApp = () => {
    const encoded = encodeURIComponent(shareText);
    Linking.openURL(`whatsapp://send?text=${encoded}`);
  };

  const handleSystemShare = () => {
    Share.share({ message: shareText });
  };

  const options = [
    {
      icon: "copy-outline" as const,
      label: "Copy Text",
      onPress: handleCopyText,
    },
    {
      icon: "image-outline" as const,
      label: "Share as Image",
      onPress: props.onShareAsImage,
    },
    {
      icon: "share-outline" as const,
      label: "Share via...",
      onPress: handleSystemShare,
    },
    {
      icon: "logo-twitter" as const,
      label: "Twitter",
      onPress: handleTwitter,
    },
    {
      icon: "logo-whatsapp" as const,
      label: "WhatsApp",
      onPress: handleWhatsApp,
    },
  ];

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Backdrop */}
      <Pressable style={styles.backdrop} onPress={props.onClose} />

      {/* Sheet */}
      <View style={[styles.sheet, { backgroundColor: props.colors.sheetBg }]}>
        {/* Handle */}
        <View style={styles.handleContainer}>
          <View
            style={[
              styles.handle,
              { backgroundColor: props.colors.sheetHandle },
            ]}
          />
        </View>

        {/* Header */}
        <View style={styles.sheetHeader}>
          <Text
            style={[
              styles.sheetTitle,
              {
                color: props.colors.sheetTitle,
                fontFamily: "CormorantGaramond_400Regular_Italic",
              },
            ]}
          >
            Share Quote
          </Text>
          <Pressable onPress={props.onClose}>
            <Ionicons name="close" size={24} color={props.colors.btnIcon} />
          </Pressable>
        </View>

        <View
          style={[
            styles.sheetDivider,
            { backgroundColor: props.colors.divider },
          ]}
        />

        {/* Quote Preview */}
        <View
          style={[styles.preview, { backgroundColor: props.colors.background }]}
        >
          <Text
            style={[
              styles.previewText,
              {
                color: props.colors.text,
                fontFamily: "CormorantGaramond_400Regular_Italic",
              },
            ]}
          >
            "{props.quote.text}"
          </Text>
          <Text style={[styles.previewAuthor, { color: props.colors.author }]}>
            — {props.quote.author}
          </Text>
        </View>

        {/* Share Options */}
        <ScrollView
          style={styles.optionsList}
          showsVerticalScrollIndicator={false}
        >
          {options.map((opt, index) => (
            <Pressable
              key={opt.label}
              style={[
                styles.optionRow,
                { backgroundColor: props.colors.btnBg },
                index < options.length - 1 && {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: props.colors.divider,
                },
              ]}
              onPress={opt.onPress}
            >
              <View style={styles.optionLeft}>
                <Ionicons
                  name={opt.icon}
                  size={22}
                  color={props.colors.btnIcon}
                />
                <Text
                  style={[styles.optionLabel, { color: props.colors.text }]}
                >
                  {opt.label}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={props.colors.btnIcon}
              />
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "#000",
    opacity: 0.4,
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: SCREEN_HEIGHT * 0.65,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  handleContainer: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 6,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  sheetTitle: {
    fontSize: 26,
    fontWeight: "700",
  },
  sheetDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 24,
  },
  preview: {
    marginHorizontal: 24,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
  },
  previewText: {
    fontSize: 18,
    lineHeight: 26,
    fontStyle: "italic",
    marginBottom: 8,
  },
  previewAuthor: {
    fontSize: 14,
    textAlign: "right",
  },
  optionsList: {
    marginTop: 16,
    paddingHorizontal: 24,
  },
  optionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: "400",
  },
});
