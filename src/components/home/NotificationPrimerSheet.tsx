import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../constants/colors";

type Props = {
  visible: boolean;
  colors: typeof COLORS.light;
  onEnable: () => void;
  onNotNow: () => void;
};

export default function NotificationPrimerSheet(props: Props) {
  if (!props.visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} accessibilityViewIsModal>
      <View style={styles.backdrop} />
      <View style={[styles.sheet, { backgroundColor: props.colors.sheetBg }]}>
        <View style={[styles.icon, { backgroundColor: props.colors.btnBg }]}>
          <Ionicons name="notifications-outline" size={27} color={props.colors.label} />
        </View>
        <Text style={[styles.title, { color: props.colors.text }]}>
          A quiet moment, every day
        </Text>
        <Text style={[styles.body, { color: props.colors.author }]}>
          Choose one daily reminder to return for a thoughtful quote. No promotions
          and no multiple reminders.
        </Text>
        <Pressable
          style={[styles.primaryButton, { backgroundColor: props.colors.label }]}
          onPress={props.onEnable}
          accessibilityRole="button"
          accessibilityLabel="Enable Daily Reminder"
        >
          <Text style={[styles.primaryLabel, { color: props.colors.background }]}>
            Enable Daily Reminder
          </Text>
        </Pressable>
        <Pressable
          style={styles.notNow}
          onPress={props.onNotNow}
          accessibilityRole="button"
          accessibilityLabel="Not Now"
        >
          <Text style={[styles.notNowLabel, { color: props.colors.author }]}>
            Not Now
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: "#000", opacity: 0.5 },
  sheet: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 28,
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
  },
  icon: { width: 58, height: 58, borderRadius: 29, alignItems: "center", justifyContent: "center" },
  title: { marginTop: 18, fontSize: 24, lineHeight: 31, fontWeight: "600", textAlign: "center" },
  body: { marginTop: 10, fontSize: 15, lineHeight: 23, textAlign: "center" },
  primaryButton: { alignSelf: "stretch", minHeight: 52, marginTop: 24, borderRadius: 14, alignItems: "center", justifyContent: "center", paddingHorizontal: 18 },
  primaryLabel: { fontSize: 16, lineHeight: 22, fontWeight: "600", textAlign: "center" },
  notNow: { minHeight: 44, marginTop: 8, justifyContent: "center", paddingHorizontal: 20 },
  notNowLabel: { fontSize: 15 },
});
