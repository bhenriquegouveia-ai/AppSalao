import { useEffect, useMemo, useState } from "react";
import { FlatList, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
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
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, [load]);

  const days = useMemo(() => {
    const unique = Array.from(new Set(events.map((e) => dayKeyOf(e.startTime))));
    return unique.sort();
  }, [events]);

  const categories = useMemo(() => {
    const unique = new Set<string>();
    events.forEach((e) => e.category && unique.add(e.category));
    return Array.from(unique);
  }, [events]);

  const filteredEvents = useMemo(() => {
    return events
      .filter((e) => !dayFilter || dayKeyOf(e.startTime) === dayFilter)
      .filter((e) => !categoryFilter || e.category === categoryFilter)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [events, dayFilter, categoryFilter]);

  if (status === "loading" && events.length === 0) {
    return <LoadingState label="Carregando programação..." />;
  }

  if (status === "error" && events.length === 0) {
    return <ErrorState message={error ?? "Erro desconhecido"} onRetry={load} />;
  }

  return (
    <View style={styles.container}>
      {(days.length > 1 || categories.length > 0) && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {days.length > 1 &&
            days.map((day) => (
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
          {categories.map((category) => (
            <FilterChip
              key={category}
              label={category}
              active={categoryFilter === category}
              onPress={() => setCategoryFilter(categoryFilter === category ? null : category)}
            />
          ))}
        </ScrollView>
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
    // minWidth (não flexGrow) garante que o conteúdo fique centralizado
    // quando cabe na tela, sem afetar a rolagem quando os chips não cabem.
    minWidth: "100%",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    justifyContent: "center",
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
