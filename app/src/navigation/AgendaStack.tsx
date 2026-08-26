import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AgendaScreen } from "../features/events/AgendaScreen";
import { EventDetailScreen } from "../features/events/EventDetailScreen";
import { colors } from "../constants/theme";
import { AgendaStackParamList } from "./types";

const Stack = createNativeStackNavigator<AgendaStackParamList>();

export function AgendaStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
      }}
    >
      <Stack.Screen name="AgendaList" component={AgendaScreen} options={{ title: "Agenda" }} />
      <Stack.Screen
        name="EventDetail"
        component={EventDetailScreen}
        options={{ title: "Detalhes" }}
      />
    </Stack.Navigator>
  );
}
