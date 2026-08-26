import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../constants/theme";
import { formatCountdown } from "../../lib/dateTime";
import { EventItem } from "../../types";
import { useCountdown } from "./useCountdown";

interface Props {
  event: Pick<EventItem, "startTime" | "endTime">;
}

export function Countdown({ event }: Props) {
  const { status, countdown } = useCountdown(event);

  if (status === "ended") {
    return (
      <View style={[styles.badge, { backgroundColor: colors.ended }]}>
        <Text style={styles.text}>Encerrado</Text>
      </View>
    );
  }

  if (status === "live") {
    return (
      <View style={[styles.badge, { backgroundColor: colors.live }]}>
        <Text style={styles.text}>AO VIVO · termina em {formatCountdown(countdown)}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.badge, { backgroundColor: colors.primary }]}>
      <Text style={styles.text}>Começa em {formatCountdown(countdown)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  text: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
});
