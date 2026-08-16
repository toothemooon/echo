import { ImageBackground, StyleSheet, View } from "react-native";
import type { ThemeMode } from "../../storage/preferences";

type Props = {
  theme: ThemeMode;
};

export default function ArchiveBackground({ theme }: Props) {
  if (theme !== "archive") {
    return null;
  }

  // ImageBackground guarantees the texture fills its bounds: a bare <Image>
  // sized only by absolute insets can collapse to zero size on some devices /
  // layout passes (notably the Fabric renderer), which left the archive theme
  // showing only its flat brown backgroundColor instead of the paper texture.
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <ImageBackground
        source={require("../../../assets/archive-paper-texture.jpg")}
        resizeMode="cover"
        style={StyleSheet.absoluteFill}
      >
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, styles.readabilityWash]}
        />
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  readabilityWash: {
    backgroundColor: "rgba(239, 216, 171, 0.08)",
  },
});
