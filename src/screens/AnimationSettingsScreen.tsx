import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";
import ArchiveBackground from "../components/common/ArchiveBackground";
import type {
  QuoteAnimation,
  ThemeMode,
} from "../storage/preferences";

type Props = {
  colors: typeof COLORS.light;
  theme: ThemeMode;
  animation: QuoteAnimation;
  onChangeAnimation: (animation: QuoteAnimation) => void;
  onBack: () => void;
};

const OPTIONS: Array<{
  value: QuoteAnimation;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  {
    value: "fade",
    label: "Fade",
    description: "Gently dissolve between quotes",
    icon: "contrast-outline",
  },
  {
    value: "horizontal",
    label: "Horizontal",
    description: "Move quotes left and right",
    icon: "swap-horizontal-outline",
  },
  {
    value: "none",
    label: "None",
    description: "Change quotes immediately",
    icon: "remove-outline",
  },
];

export default function AnimationSettingsScreen(props: Props) {
  return (
    <View
      style={[styles.container, { backgroundColor: props.colors.background }]}
    >
      <ArchiveBackground theme={props.theme} />

      <View style={styles.header}>
        <Pressable
          style={[styles.backBtn, { backgroundColor: props.colors.btnBg }]}
          onPress={props.onBack}
          accessibilityRole="button"
          accessibilityLabel="Back to Settings"
          hitSlop={10}
        >
          <Ionicons
            name="chevron-back"
            size={20}
            color={props.colors.btnIcon}
          />
        </Pressable>
        <Text style={[styles.headerTitle, { color: props.colors.text }]}>ANIMATION</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <View
        style={[styles.divider, { backgroundColor: props.colors.divider }]}
      />

      <Text style={[styles.sectionTitle, { color: props.colors.label }]}>QUOTE TRANSITION</Text>

      <View style={[styles.card, { backgroundColor: props.colors.btnBg }]}> 
        {OPTIONS.map((option, index) => {
          const selected = props.animation === option.value;

          return (
            <View key={option.value}>
              <Pressable
                style={styles.cardRow}
                onPress={() => props.onChangeAnimation(option.value)}
              >
                <View style={styles.cardLeft}>
                  <Ionicons
                    name={option.icon}
                    size={20}
                    color={props.colors.btnIcon}
                  />
                  <View>
                    <Text
                      style={[styles.cardLabel, { color: props.colors.text }]}
                    >
                      {option.label}
                    </Text>
                    <Text
                      style={[
                        styles.description,
                        { color: props.colors.author },
                      ]}
                    >
                      {option.description}
                    </Text>
                  </View>
                </View>
                <Ionicons
                  name={selected ? "checkmark-circle" : "ellipse-outline"}
                  size={22}
                  color={
                    selected ? props.colors.dot : props.colors.inactiveDot
                  }
                />
              </Pressable>

              {index < OPTIONS.length - 1 ? (
                <View
                  style={[
                    styles.cardDivider,
                    { backgroundColor: props.colors.divider },
                  ]}
                />
              ) : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backBtn: {
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
  headerPlaceholder: { width: 40 },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginTop: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 3,
    marginBottom: 14,
  },
  card: {
    borderRadius: 16,
    paddingHorizontal: 20,
  },
  cardRow: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardLabel: { fontSize: 16 },
  description: { fontSize: 12, marginTop: 3 },
  cardDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 32,
  },
});
