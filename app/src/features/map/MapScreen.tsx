import { useEffect, useMemo, useRef, useState } from "react";
import { Image, LayoutChangeEvent, StyleSheet, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors } from "../../constants/theme";
import { EmptyState, ErrorState, LoadingState } from "../../components/StateView";
import { MapStackParamList } from "../../navigation/types";
import { EventItem } from "../../types";
import { getEventStatus } from "../../lib/dateTime";
import { useEventsStore } from "../events/store";
import { PlantaPin } from "./PlantaPin";
import { EventPreviewCard } from "./EventPreviewCard";
import { ZoomPan, ZoomPanHandle } from "./ZoomPan";

type Props = NativeStackScreenProps<MapStackParamList, "MapView">;

const PLANTA_IMAGE = require("../../../assets/planta-salao.png");
// Dimensões reais do arquivo (ver app/assets/planta-salao.png) — usadas pra
// calcular o enquadramento sem distorcer a planta em nenhum tamanho de tela.
const PLANTA_ASPECT_RATIO = 2350 / 820;

interface RoomPin {
  key: string;
  locationName: string;
  x: number;
  y: number;
  activeEvent: EventItem;
}

// Marcador curto exibido dentro do pin: usa o número da arena/sala quando
// existe (ex: "Arena 1 - Keeta" -> "1"), senão a primeira letra do nome.
function shortMarkerLabel(locationName: string): string {
  const match = locationName.match(/\d+/);
  return match ? match[0] : locationName.slice(0, 1).toUpperCase();
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
  const [selectedRoomKey, setSelectedRoomKey] = useState<string | null>(null);
  // A área do mapa tem a MESMA proporção da imagem (via style `aspectRatio`),
  // então largura/altura da viewport já são exatamente as da planta — sem
  // letterboxing nem espaço vazio sobrando, em qualquer tamanho de tela.
  const [viewport, setViewport] = useState<{ width: number; height: number } | null>(null);
  const hasCenteredRef = useRef(false);

  const zoomPanRef = useRef<ZoomPanHandle>(null);

  const plantaWidth = viewport?.width ?? 0;
  const plantaHeight = viewport?.height ?? 0;

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setViewport({ width, height });
  };

  useEffect(() => {
    load();
  }, [load]);

  const pins = useMemo(() => pickRoomPins(events), [events]);

  const focusEventId = route.params?.focusEventId;

  // Enquadramento inicial: centraliza a planta inteira (escala 1 = "contain
  // fit", já calculado acima) assim que soubermos o tamanho da viewport.
  useEffect(() => {
    if (!viewport || plantaWidth === 0 || hasCenteredRef.current) return;
    hasCenteredRef.current = true;
    zoomPanRef.current?.centerOn(plantaWidth / 2, plantaHeight / 2, 1);
  }, [viewport, plantaWidth, plantaHeight]);

  useEffect(() => {
    if (!focusEventId || pins.length === 0 || plantaWidth === 0) return;

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
      {/* aspectRatio faz a área do mapa ter exatamente o formato da imagem —
          sem letterboxing nem espaço vazio sobrando, em qualquer tela. */}
      <View style={styles.mapViewport} onLayout={handleLayout}>
        {viewport && (
          <ZoomPan
            ref={zoomPanRef}
            viewportWidth={viewport.width}
            viewportHeight={viewport.height}
          >
            <View style={{ width: plantaWidth, height: plantaHeight }}>
              <Image
                source={PLANTA_IMAGE}
                style={styles.plantaImage}
                resizeMode="contain"
                accessibilityLabel="Planta do Salão Abrasel"
              />
              {pins.map((pin) => (
                <PlantaPin
                  key={pin.key}
                  x={pin.x}
                  y={pin.y}
                  status={getEventStatus(pin.activeEvent)}
                  highlighted={pin.key === selectedRoomKey}
                  label={shortMarkerLabel(pin.locationName)}
                  onPress={() => setSelectedRoomKey(pin.key)}
                />
              ))}
            </View>
          </ZoomPan>
        )}
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
    justifyContent: "center",
  },
  mapViewport: {
    width: "100%",
    aspectRatio: PLANTA_ASPECT_RATIO,
    overflow: "hidden",
  },
  plantaImage: {
    width: "100%",
    height: "100%",
  },
});
