import { Image, StyleSheet, View } from "react-native";
import type { ThemeMode } from "../../storage/preferences";

type Props = {
  theme: ThemeMode;
};

export default function ArchiveBackground({ theme }: Props) {
  if (theme !== "archive") {
    return null;
  }

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Image
        source={require("../../../assets/archive-paper-texture.jpg")}
        resizeMode="cover"
        style={StyleSheet.absoluteFill}
      />
      <View style={[StyleSheet.absoluteFill, styles.readabilityWash]} />
    </View>
  );
}

const styles = StyleSheet.create({
  readabilityWash: {
    backgroundColor: "rgba(239, 216, 171, 0.08)",
  },
});
