import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing } from "../../constants/theme";
import { formatEventTime } from "../../lib/dateTime";
import { EventItem } from "../../types";
import { Countdown } from "../events/Countdown";

interface Props {
  event: EventItem;
  onPress: () => void;
  onClose: () => void;
}

export function EventPreviewCard({ event, onPress, onClose }: Props) {
  return (
    <View style={styles.card}>
      <Pressable style={styles.closeButton} onPress={onClose} hitSlop={8}>
        <Text style={styles.closeText}>✕</Text>
      </Pressable>

      <Text style={styles.location}>{event.locationName}</Text>
      <Pressable onPress={onPress}>
        <Text style={styles.title} numberOfLines={2}>
          {event.title}
        </Text>
      </Pressable>
      <Text style={styles.time}>
        {formatEventTime(event.startTime)}–{formatEventTime(event.endTime)}
      </Text>

      <View style={styles.footer}>
        <Countdown event={event} />
        <Pressable style={styles.detailButton} onPress={onPress}>
          <Text style={styles.detailButtonText}>Ver detalhes</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  closeButton: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    zIndex: 1,
  },
  closeText: {
    fontSize: 16,
    color: colors.textMuted,
  },
  location: {
    fontSize: 12,
    color: colors.textMuted,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginTop: 2,
    paddingRight: spacing.lg,
  },
  time: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.sm,
  },
  detailButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
  },
  detailButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
});
