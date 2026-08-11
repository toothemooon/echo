import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ArchiveBackground from "../components/common/ArchiveBackground";
import { COLORS } from "../constants/colors";
import type { ThemeMode } from "../storage/preferences";

type Props = {
  colors: typeof COLORS.light;
  theme: ThemeMode;
  highContrast: boolean;
  onChangeHighContrast: (value: boolean) => void;
  onBack: () => void;
};

const FEATURES = [
  {
    icon: "volume-high-outline" as const,
    title: "VoiceOver",
    description:
      "Key controls have spoken labels, roles, states, and clear navigation names.",
    enabled: true,
  },
  {
    icon: "text-outline" as const,
    title: "Dynamic Type",
    description:
      "Quote and detail screens follow the system text size and remain scrollable at larger sizes.",
    enabled: true,
  },
];

export default function AccessibilityScreen(props: Props) {
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
        <Text style={[styles.headerTitle, { color: props.colors.text }]}>
          ACCESSIBILITY
        </Text>
        <View style={styles.headerPlaceholder} />
      </View>
      <View style={[styles.divider, { backgroundColor: props.colors.divider }]} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Text style={[styles.intro, { color: props.colors.author }]}>
          ECHO follows core iOS accessibility settings. These options improve
          readability without changing quote content.
        </Text>

        <View style={[styles.card, { backgroundColor: props.colors.btnBg }]}>
          {FEATURES.map((feature, index) => (
            <View key={feature.title}>
              <View style={styles.featureRow}>
                <Ionicons
                  name={feature.icon}
                  size={22}
                  color={props.colors.btnIcon}
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                />
                <View style={styles.featureText}>
                  <Text style={[styles.title, { color: props.colors.text }]}>
                    {feature.title}
                  </Text>
                  <Text style={[styles.description, { color: props.colors.author }]}>
                    {feature.description}
                  </Text>
                </View>
                <Ionicons name="checkmark-circle" size={21} color={props.colors.label} />
                <Text style={[styles.enabledLabel, { color: props.colors.label }]}>Enabled</Text>
              </View>
              {index < FEATURES.length - 1 ? (
                <View style={[styles.rowDivider, { backgroundColor: props.colors.divider }]} />
              ) : null}
            </View>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: props.colors.label }]}>
          DISPLAY
        </Text>
        <View style={[styles.card, { backgroundColor: props.colors.btnBg }]}>
          <View style={styles.featureRow}>
            <Ionicons
              name="contrast-outline"
              size={22}
              color={props.colors.btnIcon}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            />
            <View style={styles.featureText}>
              <Text style={[styles.title, { color: props.colors.text }]}>
                Increase Contrast
              </Text>
              <Text style={[styles.description, { color: props.colors.author }]}>
                Strengthens text and icon contrast in Light and Dark themes. Archive theme is unaffected.
              </Text>
            </View>
            <Switch
              value={props.highContrast}
              onValueChange={props.onChangeHighContrast}
              accessibilityLabel="Increase Contrast"
              accessibilityHint="Strengthens text and icon contrast in Light and Dark themes"
              trackColor={{ false: props.colors.divider, true: props.colors.label }}
              thumbColor={props.colors.text}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, paddingHorizontal: 32 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { flexShrink: 1, fontSize: 14, fontWeight: "600", letterSpacing: 2.2 },
  headerPlaceholder: { width: 44 },
  divider: { height: StyleSheet.hairlineWidth, marginTop: 24 },
  content: { paddingTop: 28, paddingBottom: 56 },
  intro: { fontSize: 15, lineHeight: 23, marginBottom: 24 },
  sectionTitle: {
    marginTop: 28,
    marginBottom: 12,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 2.4,
  },
  card: { borderRadius: 16, paddingHorizontal: 18 },
  featureRow: {
    minHeight: 88,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
  },
  featureText: { flex: 1, minWidth: 0 },
  title: { fontSize: 16, fontWeight: "500", flexShrink: 1 },
  description: { marginTop: 4, fontSize: 13, lineHeight: 19, flexShrink: 1 },
  rowDivider: { height: StyleSheet.hairlineWidth, marginLeft: 36 },
  enabledLabel: { fontSize: 13, fontWeight: "500", marginLeft: 4 },
});
