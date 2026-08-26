import { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors } from "../../constants/theme";
import { EmptyState, ErrorState, LoadingState } from "../../components/StateView";
import { MapStackParamList } from "../../navigation/types";
import { EventItem } from "../../types";
import { getEventStatus } from "../../lib/dateTime";
import { useEventsStore } from "../events/store";
import { PlantaPlaceholder } from "./PlantaPlaceholder";
import { PlantaPin } from "./PlantaPin";
import { EventPreviewCard } from "./EventPreviewCard";
import { ZoomPan, ZoomPanHandle } from "./ZoomPan";

type Props = NativeStackScreenProps<MapStackParamList, "MapView">;

interface RoomPin {
  key: string;
  locationName: string;
  x: number;
  y: number;
  activeEvent: EventItem;
}

// Cada "sala" vira um pin. Quando mais de um evento acontece na mesma sala,
// mostramos o que está ao vivo agora ou, se nenhum, o próximo a começar.
function pickRoomPins(events: EventItem[]): RoomPin[] {
  const withCoords = events.filter((e) => e.locationMapX != null && e.locationMapY != null);
  const byLocation = new Map<string, EventItem[]>();

  for (const event of withCoords) {
    const list = byLocation.get(event.locationName) ?? [];
    list.push(event);
    byLocation.set(event.locationName, list);
  }

  const pins: RoomPin[] = [];
  for (const [locationName, roomEvents] of byLocation) {
    const now = new Date();
    const live = roomEvents.find((e) => getEventStatus(e, now) === "live");
    const nextUpcoming = roomEvents
      .filter((e) => getEventStatus(e, now) === "upcoming")
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0];
    const mostRecentEnded = roomEvents
      .filter((e) => getEventStatus(e, now) === "ended")
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())[0];

    const activeEvent = live ?? nextUpcoming ?? mostRecentEnded;
    if (!activeEvent) continue;

    pins.push({
      key: locationName,
      locationName,
      x: activeEvent.locationMapX as number,
      y: activeEvent.locationMapY as number,
      activeEvent,
    });
  }

  return pins;
}

export function MapScreen({ route, navigation }: Props) {
  const { events, status, error, load } = useEventsStore();
  const { width: windowWidth } = useWindowDimensions();
  const [selectedRoomKey, setSelectedRoomKey] = useState<string | null>(null);

  const zoomPanRef = useRef<ZoomPanHandle>(null);

  const viewportWidth = windowWidth;
  const viewportHeight = 420;
  const plantaWidth = viewportWidth;
  const plantaHeight = 560;

  useEffect(() => {
    load();
  }, [load]);

  const pins = useMemo(() => pickRoomPins(events), [events]);

  const focusEventId = route.params?.focusEventId;

  useEffect(() => {
    if (!focusEventId || pins.length === 0) return;

    const pin = pins.find((p) => p.activeEvent.id === focusEventId);
    if (pin) {
      setSelectedRoomKey(pin.key);
      zoomPanRef.current?.centerOn(pin.x * plantaWidth, pin.y * plantaHeight, 2);
    }
  }, [focusEventId, pins, plantaWidth, plantaHeight]);

  if (status === "loading" && events.length === 0) {
    return <LoadingState label="Carregando mapa..." />;
  }

  if (status === "error" && events.length === 0) {
    return <ErrorState message={error ?? "Erro desconhecido"} onRetry={load} />;
  }

  if (pins.length === 0) {
    return <EmptyState message="Nenhum evento com localização cadastrada no mapa ainda." />;
  }

  const selectedPin = pins.find((p) => p.key === selectedRoomKey);

  return (
    <View style={styles.container}>
      <View style={{ width: viewportWidth, height: viewportHeight, overflow: "hidden" }}>
        <ZoomPan ref={zoomPanRef} viewportWidth={viewportWidth} viewportHeight={viewportHeight}>
          <View style={{ width: plantaWidth, height: plantaHeight }}>
            <PlantaPlaceholder width={plantaWidth} height={plantaHeight} />
            {pins.map((pin) => (
              <PlantaPin
                key={pin.key}
                x={pin.x}
                y={pin.y}
                status={getEventStatus(pin.activeEvent)}
                highlighted={pin.key === selectedRoomKey}
                label={pin.locationName}
                onPress={() => setSelectedRoomKey(pin.key)}
              />
            ))}
          </View>
        </ZoomPan>
      </View>

      {selectedPin && (
        <EventPreviewCard
          event={selectedPin.activeEvent}
          onClose={() => setSelectedRoomKey(null)}
          onPress={() =>
            navigation.navigate("EventDetail", { eventId: selectedPin.activeEvent.id })
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
