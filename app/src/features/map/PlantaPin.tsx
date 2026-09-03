import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../constants/theme";
import { EventStatus } from "../../types";

interface Props {
  x: number; // 0..1, relativo à largura da planta
  y: number; // 0..1, relativo à altura da planta
  status: EventStatus;
  highlighted: boolean;
  /** Código curto exibido dentro do pin (ex: "1", "2") — já formatado pelo chamador. */
  label: string;
  onPress: () => void;
}

const STATUS_COLOR: Record<EventStatus, string> = {
  upcoming: colors.marinho,
  live: colors.live,
  ended: colors.ended,
};

export function PlantaPin({ x, y, status, highlighted, label, onPress }: Props) {
  return (
    <View
      style={[
        styles.wrapper,
        { left: `${x * 100}%`, top: `${y * 100}%` },
      ]}
      pointerEvents="box-none"
    >
      <Pressable
        onPress={onPress}
        hitSlop={10}
        style={[
          styles.pin,
          { backgroundColor: STATUS_COLOR[status] },
          highlighted && styles.pinHighlighted,
        ]}
      >
        <Text style={styles.pinText}>{label}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    marginLeft: -14,
    marginTop: -14,
  },
  pin: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  pinHighlighted: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginLeft: -3,
    marginTop: -3,
    borderColor: colors.secondary,
    borderWidth: 3,
  },
  pinText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },
});
