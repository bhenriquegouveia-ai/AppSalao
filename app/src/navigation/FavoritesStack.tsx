import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { FavoritesScreen } from "../features/favorites/FavoritesScreen";
import { EventDetailScreen } from "../features/events/EventDetailScreen";
import { colors } from "../constants/theme";
import { FavoritesStackParamList } from "./types";

const Stack = createNativeStackNavigator<FavoritesStackParamList>();

export function FavoritesStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
      }}
    >
      <Stack.Screen
        name="FavoritesList"
        component={FavoritesScreen}
        options={{ title: "Meus Favoritos" }}
      />
      <Stack.Screen
        name="EventDetail"
        component={EventDetailScreen}
        options={{ title: "Detalhes" }}
      />
    </Stack.Navigator>
  );
}
