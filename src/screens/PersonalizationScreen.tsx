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
  mood: MoodPreference;
  onChangeMood: (mood: MoodPreference) => void;
  onBack: () => void;
};

export default function PersonalizationScreen(props: Props) {
  return (
    <View style={[styles.container, { backgroundColor: props.colors.background }]}>
      <ArchiveBackground theme={props.theme} />
      <View style={styles.header}>
        <Pressable
          style={[styles.backBtn, { backgroundColor: props.colors.btnBg }]}
          onPress={props.onBack}
        >
          <Ionicons name="chevron-back" size={20} color={props.colors.btnIcon} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: props.colors.text }]}>
          PREFERENCES
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={[styles.divider, { backgroundColor: props.colors.divider }]} />
      <Text style={[styles.question, { color: props.colors.text }]}>
        How have you been feeling lately?
      </Text>
      <Text style={[styles.intro, { color: props.colors.author }]}>
        Your answer quietly adjusts the mix of quotes. You can change it at any time.
      </Text>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: props.colors.btnBg }]}>
          {MOOD_OPTIONS.map((option, index) => {
            const selected = option.value === props.mood;
            return (
              <Pressable
                key={option.value}
                style={[
                  styles.row,
                  index < MOOD_OPTIONS.length - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: props.colors.divider,
                  },
                ]}
                onPress={() => props.onChangeMood(option.value)}
              >
                <View style={styles.copy}>
                  <Text style={[styles.label, { color: props.colors.text }]}>
                    {option.label}
                  </Text>
                  <Text style={[styles.summary, { color: props.colors.author }]}>
                    {option.summary}
                  </Text>
                </View>
                <Ionicons
                  name={selected ? "checkmark-circle" : "ellipse-outline"}
                  size={22}
                  color={selected ? props.colors.label : props.colors.inactiveDot}
                />
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, paddingHorizontal: 32, paddingBottom: 32 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 14, fontWeight: "500", letterSpacing: 3 },
  divider: { height: StyleSheet.hairlineWidth, marginTop: 24, marginBottom: 28 },
  question: { fontSize: 25, lineHeight: 32, fontWeight: "500" },
  intro: { fontSize: 14, lineHeight: 20, marginTop: 8, marginBottom: 22 },
  card: { borderRadius: 16, paddingHorizontal: 18, marginBottom: 20 },
  row: { minHeight: 66, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 16 },
  copy: { flex: 1, paddingVertical: 12 },
  label: { fontSize: 16 },
  summary: { fontSize: 12, marginTop: 3 },
});
