import { useEffect, useRef } from "react";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer, NavigationContainerRef } from "@react-navigation/native";
import * as Notifications from "expo-notifications";
import { RootTabs } from "./src/navigation/RootTabs";
import { RootTabParamList } from "./src/navigation/types";

export default function App() {
  const navigationRef = useRef<NavigationContainerRef<RootTabParamList>>(null);

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

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer ref={navigationRef}>
          <RootTabs />
        </NavigationContainer>
        <StatusBar style="auto" />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
