import * as Notifications from "expo-notifications";
import { Alert, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NOTIFICATION_OFFSETS_MINUTES } from "../../constants/notificationOffsets";
import { EventItem } from "../../types";

const SCHEDULED_MAP_KEY = "@salao-abrasel/notification-ids";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function readMap(): Promise<Record<string, string[]>> {
  const raw = await AsyncStorage.getItem(SCHEDULED_MAP_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, string[]>;
  } catch {
    return {};
  }
}

async function writeMap(map: Record<string, string[]>): Promise<void> {
  await AsyncStorage.setItem(SCHEDULED_MAP_KEY, JSON.stringify(map));
}

let hasExplainedPermission = false;

// Pedido de permissão amigável: explica o motivo ANTES do prompt nativo do
// sistema, chamado na hora do primeiro favorito (não na abertura do app).
export async function ensureNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;

  if (!hasExplainedPermission) {
    hasExplainedPermission = true;
    await new Promise<void>((resolve) => {
      Alert.alert(
        "Não perca sua palestra favorita",
        "Podemos te avisar antes dos eventos que você favoritar (1 dia, 1 hora e 15 minutos antes). Permitir notificações?",
        [{ text: "Entendi", onPress: () => resolve() }]
      );
    });
  }

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

// Agendar notificação é um efeito colateral "melhor esforço" do favoritar —
// nunca deve derrubar a ação de favoritar em si (ex: web não implementa
// agendamento nativo e lançaria erro; permissão pode não estar disponível).
export async function scheduleNotificationsForEvent(event: EventItem): Promise<void> {
  try {
    const granted = await ensureNotificationPermission();
    if (!granted) return;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Programação do evento",
        importance: Notifications.AndroidImportance.HIGH,
      });
    }

    // Evita duplicar caso o evento já tenha notificações agendadas.
    await cancelNotificationsForEvent(event.id);

    const startTime = new Date(event.startTime).getTime();
    const identifiers: string[] = [];

    for (const offset of NOTIFICATION_OFFSETS_MINUTES) {
      const triggerAt = startTime - offset.minutesBefore * 60 * 1000;
      if (triggerAt <= Date.now()) continue;

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: `${offset.label}: ${event.title}`,
          body: `${event.locationName} · fique de olho no horário!`,
          data: { eventId: event.id },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: new Date(triggerAt),
        },
      });

      identifiers.push(identifier);
    }

    const map = await readMap();
    map[event.id] = identifiers;
    await writeMap(map);
  } catch (err) {
    console.warn("Falha ao agendar notificações (favorito foi salvo normalmente):", err);
  }
}

export async function cancelNotificationsForEvent(eventId: string): Promise<void> {
  try {
    const map = await readMap();
    const identifiers = map[eventId] ?? [];

    await Promise.all(
      identifiers.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => {}))
    );

    delete map[eventId];
    await writeMap(map);
  } catch (err) {
    console.warn("Falha ao cancelar notificações:", err);
  }
}

// Chamado ao sincronizar com a API: se o horário de um evento favoritado
// mudou, reagenda do zero para refletir o novo horário.
export async function rescheduleIfNeeded(event: EventItem): Promise<void> {
  const map = await readMap();
  if (map[event.id]) {
    await scheduleNotificationsForEvent(event);
  }
}
