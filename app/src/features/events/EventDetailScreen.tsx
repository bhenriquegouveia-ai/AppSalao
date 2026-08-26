import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { NavigationProp } from "@react-navigation/native";
import { colors, radius, spacing } from "../../constants/theme";
import { LoadingState, ErrorState } from "../../components/StateView";
import {
  AgendaStackParamList,
  FavoritesStackParamList,
  MapStackParamList,
  RootTabParamList,
} from "../../navigation/types";
import { EventItem } from "../../types";
import { formatEventDate, formatEventTime } from "../../lib/dateTime";
import { useEventsStore } from "./store";
import { useFavoritesStore } from "../favorites/store";
import { fetchEventById } from "./api";
import { Countdown } from "./Countdown";

// EventDetail existe nas stacks de Agenda, Favoritos e Mapa — a tela é a
// mesma, então tipamos com a interseção dos três param lists.
type Props = NativeStackScreenProps<
  AgendaStackParamList & FavoritesStackParamList & MapStackParamList,
  "EventDetail"
>;

export function EventDetailScreen({ route, navigation }: Props) {
  const { eventId } = route.params;
  const cachedEvent = useEventsStore((s) => s.events.find((e) => e.id === eventId));

  const [event, setEvent] = useState<EventItem | undefined>(cachedEvent);
  const [status, setStatus] = useState<"idle" | "loading" | "error">(
    cachedEvent ? "idle" : "loading"
  );
  const [error, setError] = useState<string | null>(null);

  const isFavorite = useFavoritesStore((s) => (event ? s.isFavorite(event.id) : false));
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);

  useEffect(() => {
    if (cachedEvent) return;

    let cancelled = false;
    setStatus("loading");

    fetchEventById(eventId)
      .then((data) => {
        if (!cancelled) {
          setEvent(data);
          setStatus("idle");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Falha ao carregar evento");
          setStatus("error");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [eventId, cachedEvent]);

  if (status === "loading") {
    return <LoadingState label="Carregando evento..." />;
  }

  if (status === "error" || !event) {
    return <ErrorState message={error ?? "Evento não encontrado"} />;
  }

  const goToMap = () => {
    const rootNavigation = navigation.getParent<NavigationProp<RootTabParamList>>();
    rootNavigation?.navigate("Mapa", {
      screen: "MapView",
      params: { focusEventId: event.id },
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Countdown event={event} />

      <Text style={styles.title}>{event.title}</Text>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Quando</Text>
        <Text style={styles.infoValue}>
          {formatEventDate(event.startTime)} · {formatEventTime(event.startTime)}–
          {formatEventTime(event.endTime)}
        </Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Local</Text>
        <Text style={styles.infoValue}>{event.locationName}</Text>
      </View>

      {event.speaker && (
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Palestrante</Text>
          <Text style={styles.infoValue}>{event.speaker}</Text>
        </View>
      )}

      <Text style={styles.description}>{event.description}</Text>

      <View style={styles.actions}>
        <Pressable
          style={[styles.button, isFavorite && styles.buttonActive]}
          onPress={() => toggleFavorite(event)}
        >
          <Text style={[styles.buttonText, isFavorite && styles.buttonTextActive]}>
            {isFavorite ? "★ Favoritado" : "☆ Favoritar"}
          </Text>
        </Pressable>

        <Pressable style={styles.buttonOutline} onPress={goToMap}>
          <Text style={styles.buttonOutlineText}>Ver no mapa</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.text,
    marginTop: spacing.sm,
  },
  infoRow: {
    marginTop: spacing.sm,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 15,
    color: colors.text,
    marginTop: 2,
  },
  description: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
    marginTop: spacing.md,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  button: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  buttonActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  buttonText: {
    fontWeight: "700",
    color: colors.text,
  },
  buttonTextActive: {
    color: "#fff",
  },
  buttonOutline: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  buttonOutlineText: {
    color: colors.primary,
    fontWeight: "700",
  },
});
