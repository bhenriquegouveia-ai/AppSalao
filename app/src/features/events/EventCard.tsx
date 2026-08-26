import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing } from "../../constants/theme";
import { formatEventDate, formatEventTime } from "../../lib/dateTime";
import { useFavoritesStore } from "../favorites/store";
import { EventItem } from "../../types";
import { Countdown } from "./Countdown";

interface Props {
  event: EventItem;
  onPress: () => void;
}

export function EventCard({ event, onPress }: Props) {
  const isFavorite = useFavoritesStore((s) => s.isFavorite(event.id));
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.time}>
          {formatEventDate(event.startTime)} · {formatEventTime(event.startTime)}–
          {formatEventTime(event.endTime)}
        </Text>
        <Pressable hitSlop={8} onPress={() => toggleFavorite(event)}>
          <Text style={[styles.star, isFavorite && styles.starActive]}>
            {isFavorite ? "★" : "☆"}
          </Text>
        </Pressable>
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {event.title}
      </Text>
      <Text style={styles.location}>{event.locationName}</Text>

      <View style={styles.footer}>
        <Countdown event={event} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  time: {
    color: colors.textMuted,
    fontSize: 13,
  },
  star: {
    fontSize: 22,
    color: colors.textMuted,
  },
  starActive: {
    color: colors.secondary,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginTop: spacing.xs,
  },
  location: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  footer: {
    marginTop: spacing.sm,
  },
});
