import { View, StyleSheet } from "react-native";
import { COLORS } from "../constants/colors";

interface PaginationDotsProps {
  total: number;
  activeIndex: number;
  colors: (typeof COLORS)["light"];
}

export default function PaginationDots({
  total,
  activeIndex,
  colors,
}: PaginationDotsProps) {
  return (
    <View style={styles.row}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            i === activeIndex ? styles.dotActive : styles.dotInactive,
            {
              backgroundColor:
                i === activeIndex ? colors.dot : colors.inactiveDot,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },
  dotActive: {
    width: 24,
    height: 8,
    borderRadius: 4,
  },
  dotInactive: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
