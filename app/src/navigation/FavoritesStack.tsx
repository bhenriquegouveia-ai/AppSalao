import { Pressable, Text } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { FavoritesScreen } from "../features/favorites/FavoritesScreen";
import { EventDetailScreen } from "../features/events/EventDetailScreen";
import { useAuthStore } from "../features/auth/store";
import { colors, spacing } from "../constants/theme";
import { FavoritesStackParamList } from "./types";

const Stack = createNativeStackNavigator<FavoritesStackParamList>();

function LogoutButton() {
  const logout = useAuthStore((s) => s.logout);

  return (
    <Pressable onPress={() => logout()} hitSlop={8} style={{ paddingHorizontal: spacing.xs }}>
      <Text style={{ color: colors.primary, fontWeight: "600" }}>Sair</Text>
    </Pressable>
  );
}

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
        options={{ title: "Meus Favoritos", headerRight: () => <LogoutButton /> }}
      />
      <Stack.Screen
        name="EventDetail"
        component={EventDetailScreen}
        options={{ title: "Detalhes" }}
      />
    </Stack.Navigator>
  );
}
