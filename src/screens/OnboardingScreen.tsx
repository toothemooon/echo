import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";
import {
  MOOD_OPTIONS,
  type MoodPreference,
} from "../constants/categories";
import ArchiveBackground from "../components/common/ArchiveBackground";
import type { ThemeMode } from "../storage/preferences";

type Props = {
  colors: typeof COLORS.light;
  theme: ThemeMode;
  onSelect: (mood: MoodPreference) => void;
};

export default function OnboardingScreen(props: Props) {
  return (
    <View style={[styles.container, { backgroundColor: props.colors.background }]}>
      <ArchiveBackground theme={props.theme} />
      <Text style={[styles.eyebrow, { color: props.colors.label }]}>WELCOME TO ECHO</Text>
      <Text style={[styles.title, { color: props.colors.text }]}>
        How have you been feeling lately?
      </Text>
      <Text style={[styles.intro, { color: props.colors.author }]}>
        Choose what feels closest. This is only a reading preference, not a diagnosis.
      </Text>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: props.colors.btnBg }]}>
          {MOOD_OPTIONS.map((option, index) => (
            <Pressable
              key={option.value}
              style={[
                styles.row,
                index < MOOD_OPTIONS.length - 1 && {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: props.colors.divider,
                },
              ]}
              onPress={() => props.onSelect(option.value)}
              accessibilityRole="button"
              accessibilityLabel={option.label}
              accessibilityHint={option.summary}
            >
              <View style={styles.copy}>
                <Text style={[styles.label, { color: props.colors.text }]}>
                  {option.label}
                </Text>
                <Text style={[styles.summary, { color: props.colors.author }]}>
                  {option.summary}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={17} color={props.colors.btnIcon} />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 86, paddingHorizontal: 32, paddingBottom: 30 },
  eyebrow: { fontSize: 12, fontWeight: "600", letterSpacing: 3, marginBottom: 18 },
  title: { fontSize: 30, lineHeight: 38, fontWeight: "500", maxWidth: 310 },
  intro: { fontSize: 14, lineHeight: 21, marginTop: 10, marginBottom: 24 },
  card: { borderRadius: 18, paddingHorizontal: 18, marginBottom: 20 },
  row: { minHeight: 65, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 14 },
  copy: { flex: 1, paddingVertical: 11 },
  label: { fontSize: 16 },
  summary: { fontSize: 12, marginTop: 3 },
});
