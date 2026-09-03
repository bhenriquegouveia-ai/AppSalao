import { useEffect, useMemo, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, spacing } from "../../constants/theme";
import { EmptyState, ErrorState, LoadingState } from "../../components/StateView";
import { AgendaStackParamList } from "../../navigation/types";
import { useEventsStore } from "./store";
import { EventCard } from "./EventCard";
import { FilterChip } from "./FilterChip";

type Props = NativeStackScreenProps<AgendaStackParamList, "AgendaList">;

// Chave estável de "dia" no fuso do evento (Brasília), não no fuso do device.
function dayKeyOf(isoDate: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(
    new Date(isoDate)
  );
}

export function AgendaScreen({ navigation }: Props) {
  const { events, status, error, load, refresh } = useEventsStore();
  const [dayFilter, setDayFilter] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, [load]);

  const days = useMemo(() => {
    const unique = Array.from(new Set(events.map((e) => dayKeyOf(e.startTime))));
    return unique.sort();
  }, [events]);

  const filteredEvents = useMemo(() => {
    return events
      .filter((e) => !dayFilter || dayKeyOf(e.startTime) === dayFilter)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [events, dayFilter]);

  if (status === "loading" && events.length === 0) {
    return <LoadingState label="Carregando programação..." />;
  }

  if (status === "error" && events.length === 0) {
    return <ErrorState message={error ?? "Erro desconhecido"} onRetry={load} />;
  }

  return (
    <View style={styles.container}>
      {days.length > 1 && (
        <View style={styles.filters}>
          {days.map((day) => (
            <FilterChip
              key={day}
              label={new Intl.DateTimeFormat("pt-BR", {
                timeZone: "America/Sao_Paulo",
                day: "2-digit",
                month: "short",
              }).format(new Date(`${day}T12:00:00-03:00`))}
              active={dayFilter === day}
              onPress={() => setDayFilter(dayFilter === day ? null : day)}
            />
          ))}
        </View>
      )}

      {error && events.length > 0 && (
        <Text style={styles.errorBanner}>Não foi possível atualizar: {error}</Text>
      )}

      <FlatList
        data={filteredEvents}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={status === "refreshing"} onRefresh={refresh} />
        }
        renderItem={({ item }) => (
          <EventCard
            event={item}
            onPress={() => navigation.navigate("EventDetail", { eventId: item.id })}
          />
        )}
        ListEmptyComponent={
          <EmptyState message="Nenhum evento encontrado para esse filtro." />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  filters: {
    // View simples em vez de ScrollView: só há poucos filtros de data, então
    // não precisa rolar — e evita bugs de medição de altura do ScrollView
    // horizontal no react-native-web.
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  list: {
    padding: spacing.md,
    flexGrow: 1,
  },
  errorBanner: {
    backgroundColor: "#FDECEC",
    color: colors.live,
    fontSize: 12,
    padding: spacing.sm,
    marginHorizontal: spacing.md,
    borderRadius: 8,
  },
});
