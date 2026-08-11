import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ArchiveBackground from "../components/common/ArchiveBackground";
import { COLORS } from "../constants/colors";
import type { ThemeMode } from "../storage/preferences";

type Props = {
  colors: typeof COLORS.light;
  theme: ThemeMode;
  onBack: () => void;
};

const LINKS = [
  ["English Wikiquote", "https://en.wikiquote.org/"],
  ["Chinese Wikiquote", "https://zh.wikiquote.org/"],
  ["Japanese Wikiquote", "https://ja.wikiquote.org/"],
  ["CC BY-SA 4.0", "https://creativecommons.org/licenses/by-sa/4.0/"],
  ["ECHO privacy policy", "https://sarada.yachts/projects/echo/privacy"],
] as const;

async function openLink(url: string): Promise<void> {
  try {
    if (await Linking.canOpenURL(url)) {
      await Linking.openURL(url);
    } else {
      Alert.alert("Unable to open source", url);
    }
  } catch {
    Alert.alert("Unable to open source", url);
  }
}

export default function ContentSourcesScreen(props: Props) {
  return (
    <View style={[styles.container, { backgroundColor: props.colors.background }]}> 
      <ArchiveBackground theme={props.theme} />
      <View style={styles.header}>
        <Pressable
          style={[styles.backButton, { backgroundColor: props.colors.btnBg }]}
          onPress={props.onBack}
          accessibilityRole="button"
          accessibilityLabel="Back to Settings"
          hitSlop={10}
        >
          <Ionicons name="chevron-back" size={20} color={props.colors.btnIcon} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: props.colors.text }]}>CONTENT SOURCES</Text>
        <View style={styles.placeholder} />
      </View>
      <View style={[styles.divider, { backgroundColor: props.colors.divider }]} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: props.colors.text }]}>Quote data and licensing</Text>
        <Text style={[styles.body, { color: props.colors.author }]}> 
          ECHO is an offline-first reading app. Quote text, attribution, translation,
          and source metadata may have different rights. The app does not claim
          ownership of third-party quotation text.
        </Text>

        <View style={[styles.card, { backgroundColor: props.colors.btnBg }]}> 
          <Text style={[styles.cardTitle, { color: props.colors.text }]}>Published sources</Text>
          <Text style={[styles.body, { color: props.colors.author }]}> 
            Wikiquote-derived records retain the source page and revision metadata
            used for attribution. Records without reliable attribution or rights
            evidence are excluded from the published catalog.
          </Text>
          <Text style={[styles.body, { color: props.colors.author }]}> 
            ECHO-created editorial notes and original catalog records are maintained
            separately from third-party quotation rights.
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { color: props.colors.label }]}>LINKS</Text>
        <View style={[styles.card, { backgroundColor: props.colors.btnBg }]}> 
          {LINKS.map(([label, url], index) => (
            <View key={url}>
              <Pressable
                style={styles.linkRow}
                onPress={() => void openLink(url)}
                accessibilityRole="link"
                accessibilityLabel={label}
              >
                <Text style={[styles.linkLabel, { color: props.colors.text }]}>{label}</Text>
                <Ionicons name="open-outline" size={17} color={props.colors.btnIcon} />
              </Pressable>
              {index < LINKS.length - 1 ? (
                <View style={[styles.rowDivider, { backgroundColor: props.colors.divider }]} />
              ) : null}
            </View>
          ))}
        </View>

        <Text style={[styles.footer, { color: props.colors.author }]}> 
          For copyright or attribution questions, contact the developer through
          the feedback address in Settings.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, paddingHorizontal: 32 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backButton: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  placeholder: { width: 44 },
  headerTitle: { flexShrink: 1, fontSize: 13, fontWeight: "600", letterSpacing: 2.1 },
  divider: { height: StyleSheet.hairlineWidth, marginTop: 24 },
  content: { paddingTop: 28, paddingBottom: 56 },
  title: { fontSize: 25, lineHeight: 32, fontWeight: "500" },
  body: { fontSize: 14, lineHeight: 21, marginTop: 10 },
  card: { borderRadius: 16, paddingHorizontal: 18, paddingVertical: 16, marginTop: 24 },
  cardTitle: { fontSize: 17, fontWeight: "500" },
  sectionTitle: { marginTop: 28, marginBottom: 12, fontSize: 12, fontWeight: "600", letterSpacing: 2.3 },
  linkRow: { minHeight: 54, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  linkLabel: { fontSize: 15, flexShrink: 1 },
  rowDivider: { height: StyleSheet.hairlineWidth },
  footer: { fontSize: 13, lineHeight: 19, textAlign: "center", marginTop: 24 },
});
