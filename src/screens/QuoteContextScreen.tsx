import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import ArchiveBackground from "../components/common/ArchiveBackground";
import { COLORS } from "../constants/colors";
import { getAuthorContext, getQuoteContext } from "../data/quoteContexts";
import type { Quote } from "../data/quotes";
import type { ThemeMode } from "../storage/preferences";

type Props = {
  quote: Quote;
  colors: typeof COLORS.light;
  theme: ThemeMode;
  onBack: () => void;
};

const COPY = {
  en: {
    title: "ABOUT",
    life: "LIFE",
    editorial: "EDITORIAL READING",
    source: "SOURCE",
    missing: "No additional profile is available for this quote.",
  },
  "zh-Hans": {
    title: "人物",
    life: "生平",
    editorial: "编辑解读",
    source: "作品来源",
    missing: "这条名言暂时没有更多人物资料",
  },
  ja: {
    title: "人物",
    life: "人物像",
    editorial: "編集者の解釈",
    source: "出典",
    missing: "この言葉に関する人物情報はまだありません",
  },
} as const;

export default function QuoteContextScreen(props: Props) {
  const copy = COPY[props.quote.language];
  const result = getQuoteContext(props.quote.id);
  // Fall back to the author archive when this quote has no context entry, so a
  // missing context only costs the editorial reading, not the whole profile.
  const author =
    result?.author ??
    getAuthorContext(props.quote.language, props.quote.author_id);
  const source = (
    result?.context.source_work ?? props.quote.source
  )?.replace(/\s*\(secondary attribution only\)$/i, "");

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: props.colors.background },
      ]}
    >
      <ArchiveBackground theme={props.theme} />
      <StatusBar
        style={props.theme === "dark" ? "light" : "dark"}
        animated
      />

      <View style={styles.header}>
        <Pressable
          style={[styles.backButton, { backgroundColor: props.colors.btnBg }]}
          onPress={props.onBack}
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={10}
        >
          <Ionicons
            name="chevron-back"
            size={20}
            color={props.colors.btnIcon}
          />
        </Pressable>
        <Text style={[styles.headerTitle, { color: props.colors.text }]}>
          {copy.title}
        </Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <View style={[styles.divider, { backgroundColor: props.colors.divider }]} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Text style={[styles.quoteMark, { color: props.colors.dot }]}>“</Text>
        <Text style={[styles.quote, { color: props.colors.text }]}>
          {props.quote.text}
        </Text>
        <Text style={[styles.attribution, { color: props.colors.author }]}>
          — {props.quote.author}
        </Text>

        {author || result ? (
          <>
            <View style={styles.authorBlock}>
              <Text style={[styles.authorName, { color: props.colors.text }]}>
                {author?.display_name ?? props.quote.author}
              </Text>
              <Text style={[styles.role, { color: props.colors.author }]}>
                {[author?.known_role ?? props.quote.role, author?.lifespan]
                  .filter(Boolean)
                  .join(" · ")}
              </Text>
            </View>

            <Section label={copy.life} colors={props.colors}>
              {author?.biography ?? props.quote.role}
            </Section>
            {result ? (
              <Section label={copy.editorial} colors={props.colors}>
                {result.context.editorial_note}
              </Section>
            ) : null}
            {source ? (
              <Section label={copy.source} colors={props.colors}>
                {source}
              </Section>
            ) : null}
          </>
        ) : (
          <Text style={[styles.empty, { color: props.colors.author }]}>
            {copy.missing}
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

function Section(props: {
  label: string;
  colors: typeof COLORS.light;
  children: string;
}) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionLabel, { color: props.colors.label }]}>
        {props.label}
      </Text>
      <Text style={[styles.body, { color: props.colors.text }]}>
        {props.children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: "500",
    letterSpacing: 3,
  },
  headerPlaceholder: {
    width: 40,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginTop: 24,
  },
  content: {
    paddingTop: 30,
    paddingBottom: 56,
  },
  quoteMark: {
    fontSize: 50,
    lineHeight: 48,
  },
  quote: {
    fontSize: 22,
    lineHeight: 33,
    letterSpacing: 0.2,
  },
  attribution: {
    marginTop: 14,
    fontSize: 14,
    textAlign: "right",
  },
  authorBlock: {
    marginTop: 38,
    marginBottom: 4,
  },
  authorName: {
    fontSize: 24,
    fontWeight: "500",
  },
  role: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 20,
  },
  section: {
    marginTop: 28,
  },
  sectionLabel: {
    marginBottom: 9,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 2.4,
    textTransform: "uppercase",
  },
  body: {
    fontSize: 15,
    lineHeight: 25,
  },
  empty: {
    marginTop: 40,
    fontSize: 15,
    lineHeight: 24,
    textAlign: "center",
  },
});
