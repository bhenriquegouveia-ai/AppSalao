import { useEffect, useRef } from "react";
import { ActivityIndicator, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer, NavigationContainerRef } from "@react-navigation/native";
import * as Notifications from "expo-notifications";
import { RootTabs } from "./src/navigation/RootTabs";
import { AuthStackNavigator } from "./src/navigation/AuthStack";
import { RootTabParamList } from "./src/navigation/types";
import { useAuthStore } from "./src/features/auth/store";
import { colors } from "./src/constants/theme";

export default function App() {
  const navigationRef = useRef<NavigationContainerRef<RootTabParamList>>(null);
  const authStatus = useAuthStore((s) => s.status);
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    // Toque numa notificação de evento favoritado leva direto ao detalhe.
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const eventId = response.notification.request.content.data?.eventId as
        | string
        | undefined;

      if (eventId) {
        navigationRef.current?.navigate("Agenda", {
          screen: "EventDetail",
          params: { eventId },
        });
      }
    });

    return () => subscription.remove();
  }, []);

  if (authStatus === "hydrating") {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer ref={navigationRef}>
          {authStatus === "authenticated" ? <RootTabs /> : <AuthStackNavigator />}
        </NavigationContainer>
        <StatusBar style="auto" />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
