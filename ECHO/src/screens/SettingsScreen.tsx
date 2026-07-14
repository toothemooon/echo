import { View, Text, Pressable, Switch, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";

interface SettingsScreenProps {
  colors: (typeof COLORS)["light"];
  isDark: boolean;
  onToggleTheme: () => void;
  onBack: () => void;
}

export default function SettingsScreen({
  colors,
  isDark,
  onToggleTheme,
  onBack,
}: SettingsScreenProps) {
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={[styles.backBtn, { backgroundColor: colors.btnBg }]}
          onPress={onBack}
        >
          <Ionicons name="chevron-back" size={20} color={colors.btnIcon} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          SETTINGS
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={[styles.divider, { backgroundColor: colors.divider }]} />

      {/* Appearance Section */}
      <Text style={[styles.sectionTitle, { color: colors.label }]}>
        APPEARANCE
      </Text>
      <View style={[styles.card, { backgroundColor: colors.btnBg }]}>
        <View style={styles.cardRow}>
          <View style={styles.cardLeft}>
            <Ionicons
              name="color-palette-outline"
              size={20}
              color={colors.btnIcon}
            />
            <Text style={[styles.cardLabel, { color: colors.text }]}>
              Dark Mode
            </Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={onToggleTheme}
            trackColor={{ false: colors.inactiveDot, true: colors.label }}
            thumbColor="#fff"
          />
        </View>
      </View>

      {/* Font Section */}
      <Text style={[styles.sectionTitle, { color: colors.label }]}>FONTS</Text>
      <View style={[styles.card, { backgroundColor: colors.btnBg }]}>
        <View style={styles.cardRow}>
          <View style={styles.cardLeft}>
            <Ionicons name="text-outline" size={20} color={colors.btnIcon} />
            <Text style={[styles.cardLabel, { color: colors.text }]}>
              Quote Style
            </Text>
          </View>
          <Text style={[styles.cardValue, { color: colors.author }]}>
            Cormorant Garamond
          </Text>
        </View>
      </View>

      {/* About Section */}
      <Text style={[styles.sectionTitle, { color: colors.label }]}>ABOUT</Text>
      <View style={[styles.card, { backgroundColor: colors.btnBg }]}>
        <View style={styles.cardRow}>
          <View style={styles.cardLeft}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={colors.btnIcon}
            />
            <Text style={[styles.cardLabel, { color: colors.text }]}>
              Version
            </Text>
          </View>
          <Text style={[styles.cardValue, { color: colors.author }]}>
            1.0.0
          </Text>
        </View>

        <View
          style={[styles.cardDivider, { backgroundColor: colors.divider }]}
        />

        <View style={styles.cardRow}>
          <View style={styles.cardLeft}>
            <Ionicons name="heart-outline" size={20} color={colors.btnIcon} />
            <Text style={[styles.cardLabel, { color: colors.text }]}>
              Made with ♥
            </Text>
          </View>
          <Text style={[styles.cardValue, { color: colors.author }]}>Echo</Text>
        </View>
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
    textTransform: "uppercase",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginTop: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 3,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  card: {
    borderRadius: 16,
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: "400",
  },
  cardValue: {
    fontSize: 14,
  },
  cardDivider: {
    height: StyleSheet.hairlineWidth,
  },
});
