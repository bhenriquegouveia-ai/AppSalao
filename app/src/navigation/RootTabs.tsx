import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text } from "react-native";
import { colors } from "../constants/theme";
import { AgendaStackNavigator } from "./AgendaStack";
import { FavoritesStackNavigator } from "./FavoritesStack";
import { MapStackNavigator } from "./MapStack";
import { RootTabParamList } from "./types";

const Tab = createBottomTabNavigator<RootTabParamList>();

const ICONS: Record<keyof RootTabParamList, string> = {
  Agenda: "📅",
  Favoritos: "★",
  Mapa: "🗺️",
};

export function RootTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIcon: () => <Text style={{ fontSize: 18 }}>{ICONS[route.name]}</Text>,
      })}
    >
      <Tab.Screen name="Agenda" component={AgendaStackNavigator} />
      <Tab.Screen name="Favoritos" component={FavoritesStackNavigator} />
      <Tab.Screen name="Mapa" component={MapStackNavigator} />
    </Tab.Navigator>
  );
}
