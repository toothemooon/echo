import { useState } from "react";
import { View, Text, Pressable, Animated, StyleSheet, ScrollView, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../constants/colors";
import type { Quote } from "../../data/quotes";
import type { ViewedQuoteRecord } from "../../storage/viewedQuotes";

type Props = {
  visible: boolean;
  savedQuotes: Quote[];
  viewedQuotes: ViewedQuoteRecord[];
  colors: typeof COLORS.light;
  sheetAnim: Animated.Value;
  backdropAnim: Animated.Value;
  onClose: () => void;
  onRemoveSaved: (quoteId: Quote["id"]) => void;
  onClearHistory: () => void;
};

type Tab = "saved" | "history";

export default function HistorySheet(props: Props) {
  const { height } = useWindowDimensions();
  const [tab, setTab] = useState<Tab>("saved");

  if (!props.visible) return null;

  const records = tab === "saved" ? props.savedQuotes : props.viewedQuotes;

  return (
    <>
      <Animated.View
        style={[
          styles.backdrop,
          {
            opacity: props.backdropAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.4] }),
          },
        ]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={props.onClose} accessibilityLabel="Close history" />
      </Animated.View>

      <Animated.View
        style={[
          styles.sheet,
          { backgroundColor: props.colors.sheetBg, height: height * 0.72, transform: [{ translateY: props.sheetAnim }] },
        ]}
      >
        <View style={styles.handleContainer}>
          <View style={[styles.handle, { backgroundColor: props.colors.sheetHandle }]} />
        </View>

        <View style={styles.sheetHeader}>
          <Text style={[styles.sheetTitle, { color: props.colors.sheetTitle, fontFamily: "CormorantGaramond_400Regular_Italic" }]}>READING</Text>
          <Pressable onPress={props.onClose} accessibilityRole="button" accessibilityLabel="Done">
            <Text style={[styles.doneBtn, { color: props.colors.label }]}>Done</Text>
          </Pressable>
        </View>

        <View style={styles.tabs}>
          {(["saved", "history"] as Tab[]).map((value) => (
            <Pressable
              key={value}
              style={[styles.tab, tab === value && { borderBottomColor: props.colors.label }]}
              onPress={() => setTab(value)}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === value }}
            >
              <Text style={[styles.tabLabel, { color: tab === value ? props.colors.text : props.colors.author }]}>
                {value === "saved" ? "Saved" : "History"}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={[styles.sheetDivider, { backgroundColor: props.colors.divider }]} />

        {records.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: props.colors.sheetEmpty, fontFamily: "CormorantGaramond_400Regular_Italic" }]}>
              {tab === "saved" ? "No saved quotes yet." : "Your reading history is empty."}
            </Text>
          </View>
        ) : (
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {tab === "saved"
              ? (records as Quote[]).map((quote) => (
                  <View key={`${typeof quote.id}:${String(quote.id)}`} style={[styles.savedItem, { backgroundColor: props.colors.btnBg }]}>
                    <Pressable
                      style={styles.deleteBtn}
                      onPress={() => props.onRemoveSaved(quote.id)}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${quote.author} from saved quotes`}
                    >
                      <Ionicons name="close-circle" size={20} color={props.colors.menuIcon} />
                    </Pressable>
                    <Text style={[styles.savedText, { color: props.colors.text }]} numberOfLines={6}>
                      “{quote.text}”
                    </Text>
                    <Text style={[styles.savedAuthor, { color: props.colors.author }]}>— {quote.author}</Text>
                  </View>
                ))
              : (records as ViewedQuoteRecord[]).map((record) => (
                  <View key={`${typeof record.quote.id}:${String(record.quote.id)}`} style={[styles.savedItem, { backgroundColor: props.colors.btnBg }]}>
                    <Text style={[styles.savedText, { color: props.colors.text }]} numberOfLines={6}>
                      “{record.quote.text}”
                    </Text>
                    <Text style={[styles.savedAuthor, { color: props.colors.author }]}>— {record.quote.author}</Text>
                    <Text style={[styles.viewedAt, { color: props.colors.author }]}>
                      {new Date(record.viewedAt).toLocaleString()}
                    </Text>
                  </View>
                ))}
          </ScrollView>
        )}

        {tab === "history" && props.viewedQuotes.length > 0 ? (
          <Pressable style={styles.clearHistory} onPress={props.onClearHistory} accessibilityRole="button" accessibilityLabel="Clear reading history">
            <Text style={[styles.clearHistoryLabel, { color: props.colors.label }]}>Clear History</Text>
          </Pressable>
        ) : null}
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: "#000", zIndex: 10 },
  sheet: { position: "absolute", left: 0, right: 0, bottom: 0, borderTopLeftRadius: 20, borderTopRightRadius: 20, zIndex: 20, paddingBottom: 28 },
  handleContainer: { alignItems: "center", paddingTop: 10, paddingBottom: 6 },
  handle: { width: 36, height: 4, borderRadius: 2 },
  sheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24, paddingVertical: 12 },
  sheetTitle: { fontSize: 26, fontWeight: "700" },
  doneBtn: { fontSize: 16, fontWeight: "600" },
  tabs: { flexDirection: "row", marginHorizontal: 24, gap: 20 },
  tab: { minWidth: 72, paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabLabel: { fontSize: 15, textAlign: "center" },
  sheetDivider: { height: StyleSheet.hairlineWidth, marginHorizontal: 24 },
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  emptyText: { fontSize: 18, fontStyle: "italic", textAlign: "center" },
  list: { flex: 1, paddingTop: 20, paddingHorizontal: 24 },
  savedItem: { marginBottom: 12, borderRadius: 12, padding: 16, position: "relative" },
  deleteBtn: { position: "absolute", top: 12, right: 12, zIndex: 1 },
  savedText: { fontSize: 19, lineHeight: 27, fontStyle: "italic", marginBottom: 6, paddingRight: 28 },
  savedAuthor: { fontSize: 14, textAlign: "right" },
  viewedAt: { fontSize: 11, textAlign: "right", marginTop: 5 },
  clearHistory: { minHeight: 42, alignItems: "center", justifyContent: "center", marginHorizontal: 24, marginTop: 8 },
  clearHistoryLabel: { fontSize: 14, fontWeight: "600" },
});
