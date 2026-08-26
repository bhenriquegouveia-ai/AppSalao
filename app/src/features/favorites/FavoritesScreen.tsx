import { useEffect, useMemo } from "react";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, spacing } from "../../constants/theme";
import { EmptyState, ErrorState, LoadingState } from "../../components/StateView";
import { FavoritesStackParamList } from "../../navigation/types";
import { EventCard } from "../events/EventCard";
import { useFavoritesStore } from "./store";

type Props = NativeStackScreenProps<FavoritesStackParamList, "FavoritesList">;

export function FavoritesScreen({ navigation }: Props) {
  const { favorites, status, error, load } = useFavoritesStore();

  useEffect(() => {
    load();
  }, [load]);

  const sorted = useMemo(
    () =>
      [...favorites].sort(
        (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      ),
    [favorites]
  );

  if (status === "loading" && favorites.length === 0) {
    return <LoadingState label="Carregando favoritos..." />;
  }

  if (status === "error" && favorites.length === 0) {
    return <ErrorState message={error ?? "Erro desconhecido"} onRetry={load} />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={status === "loading"} onRefresh={load} />}
        renderItem={({ item }) => (
          <EventCard
            event={item}
            onPress={() => navigation.navigate("EventDetail", { eventId: item.id })}
          />
        )}
        ListEmptyComponent={
          <EmptyState message="Você ainda não favoritou nenhum evento. Toque na estrela de um evento na Agenda para acompanhá-lo aqui." />
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
  list: {
    padding: spacing.md,
    flexGrow: 1,
  },
});
