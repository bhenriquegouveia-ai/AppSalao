import { useEffect, useMemo, useRef, useState } from "react";
import { Image, LayoutChangeEvent, Pressable, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../../constants/theme";
import { EmptyState, ErrorState, LoadingState } from "../../components/StateView";
import { MapStackParamList } from "../../navigation/types";
import { EventItem, EventStatus } from "../../types";
import { getEventStatus } from "../../lib/dateTime";
import { useEventsStore } from "../events/store";
import { useFavoritesStore } from "../favorites/store";
import { PlantaPin } from "./PlantaPin";
import { EventPreviewCard } from "./EventPreviewCard";
import { PlacePreviewCard } from "./PlacePreviewCard";
import { POINTS_OF_INTEREST } from "./pointsOfInterest";
import { ZoomPan, ZoomPanHandle } from "./ZoomPan";

type Props = NativeStackScreenProps<MapStackParamList, "MapView">;

const PLANTA_IMAGE = require("../../../assets/planta-salao.png");
// Dimensões reais do arquivo (ver app/assets/planta-salao.png) — o conteúdo
// dentro do ZoomPan é sempre renderizado nesse tamanho (nunca no tamanho,
// menor, da viewport) e depois ESCALADO PRA BAIXO pra caber na tela. Isso é
// o oposto do que fazíamos antes (renderizar do tamanho da viewport e
// escalar pra CIMA ao dar zoom) — escalar uma imagem pequena pra cima é o
// que causava o borrão ao dar zoom, tanto no mobile quanto no desktop.
const PLANTA_NATIVE_WIDTH = 2350;
const PLANTA_NATIVE_HEIGHT = 820;
// Quanto além do "encaixado na tela" o usuário pode ampliar.
const MAX_ZOOM_MULTIPLIER = 4;

const STATUS_COLOR: Record<EventStatus, string> = {
  upcoming: colors.marinho,
  live: colors.live,
  ended: colors.ended,
};

// Pins informativos (estandes/ativações sem horário marcado) usam uma cor
// fixa, diferente da paleta de status das palestras — deixa claro que são
// dois tipos de pin diferentes.
const POI_COLOR = colors.secondary;

interface RoomPin {
  key: string;
  locationName: string;
  x: number;
  y: number;
  activeEvent: EventItem;
}

type Selection = { kind: "event"; key: string } | { kind: "poi"; key: string } | null;

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
  const { favorites, load: loadFavorites, status: favoritesStatus } = useFavoritesStore();
  const [selection, setSelection] = useState<Selection>(null);
  // A viewport agora ocupa a tela toda (style `mapViewport` com `flex: 1`),
  // então pode ter uma proporção bem diferente da planta — sem isso, no
  // celular (tela alta e estreita) o mapa virava uma faixinha horizontal
  // encolhida bem no meio da tela, com espaço vazio enorme acima/abaixo.
  const [viewport, setViewport] = useState<{ width: number; height: number } | null>(null);
  const hasCenteredRef = useRef(false);

  const zoomPanRef = useRef<ZoomPanHandle>(null);

  // Escala em que a planta (na resolução nativa) cabe INTEIRA na viewport,
  // sem cortar nada — é o zoom mínimo permitido (usuário sempre consegue
  // "dar zoom out" até ver o mapa completo).
  const fitScale = viewport
    ? Math.min(viewport.width / PLANTA_NATIVE_WIDTH, viewport.height / PLANTA_NATIVE_HEIGHT)
    : 1;
  // Escala em que a planta PREENCHE a viewport toda (cortando o que sobrar
  // dos lados) — usada no enquadramento inicial, focado num pin específico,
  // pra aproveitar a tela toda em vez de sobrar espaço vazio.
  const fillScale = viewport
    ? Math.max(viewport.width / PLANTA_NATIVE_WIDTH, viewport.height / PLANTA_NATIVE_HEIGHT)
    : 1;
  const maxScale = fitScale * MAX_ZOOM_MULTIPLIER;

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setViewport({ width, height });
  };

  useEffect(() => {
    load();
    loadFavorites();
  }, [load, loadFavorites]);

  const pins = useMemo(() => pickRoomPins(events), [events]);

  // Palestra favoritada mais relevante agora: a que já começou (se houver)
  // ou, senão, a próxima a começar — é nela que focamos o mapa ao abrir a
  // tela, pra já mostrar de cara a arena/estande de quem o usuário marcou.
  const nextFavoriteEvent = useMemo(() => {
    const now = new Date();
    const withCoords = favorites.filter((e) => e.locationMapX != null && e.locationMapY != null);
    const live = withCoords.find((e) => getEventStatus(e, now) === "live");
    if (live) return live;

    return withCoords
      .filter((e) => getEventStatus(e, now) === "upcoming")
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0];
  }, [favorites]);

  const focusEventId = route.params?.focusEventId;

  // Enquadramento inicial: se não veio um foco explícito (navegação a partir
  // do detalhe de um evento), foca na próxima palestra favoritada — usando a
  // escala "preenche a tela" pra aproveitar o espaço todo. Sem favoritos
  // (ou ainda carregando), cai no fallback de mostrar a planta inteira.
  useEffect(() => {
    if (!viewport || hasCenteredRef.current || focusEventId) return;
    if (favoritesStatus === "loading") return; // espera decidir com a lista certa

    hasCenteredRef.current = true;

    if (nextFavoriteEvent) {
      const pin = pins.find((p) => p.locationName === nextFavoriteEvent.locationName);
      if (pin) setSelection({ kind: "event", key: pin.key });

      zoomPanRef.current?.centerOn(
        (nextFavoriteEvent.locationMapX as number) * PLANTA_NATIVE_WIDTH,
        (nextFavoriteEvent.locationMapY as number) * PLANTA_NATIVE_HEIGHT,
        fillScale
      );
    } else {
      zoomPanRef.current?.centerOn(PLANTA_NATIVE_WIDTH / 2, PLANTA_NATIVE_HEIGHT / 2, fitScale);
    }
  }, [viewport, fitScale, fillScale, focusEventId, favoritesStatus, nextFavoriteEvent, pins]);

  useEffect(() => {
    if (!focusEventId || pins.length === 0 || !viewport) return;

    const pin = pins.find((p) => p.activeEvent.id === focusEventId);
    if (pin) {
      hasCenteredRef.current = true;
      setSelection({ kind: "event", key: pin.key });
      zoomPanRef.current?.centerOn(
        pin.x * PLANTA_NATIVE_WIDTH,
        pin.y * PLANTA_NATIVE_HEIGHT,
        fillScale
      );
    }
  }, [focusEventId, pins, viewport, fillScale]);

  if (status === "loading" && events.length === 0) {
    return <LoadingState label="Carregando mapa..." />;
  }

  if (status === "error" && events.length === 0) {
    return <ErrorState message={error ?? "Erro desconhecido"} onRetry={load} />;
  }

  if (pins.length === 0 && POINTS_OF_INTEREST.length === 0) {
    return <EmptyState message="Nenhum evento com localização cadastrada no mapa ainda." />;
  }

  const selectedPin =
    selection?.kind === "event" ? pins.find((p) => p.key === selection.key) : undefined;
  const selectedPoi =
    selection?.kind === "poi" ? POINTS_OF_INTEREST.find((p) => p.key === selection.key) : undefined;

  return (
    <View style={styles.container}>
      {/* flex: 1 faz o mapa ocupar a tela toda (e não uma faixinha no meio,
          que é o que dava com aspectRatio fixo numa tela alta e estreita).
          A planta tem outra proporção — o fillScale calculado acima cuida
          de preencher a viewport sem deixar espaço vazio sobrando. */}
      <View style={styles.mapViewport} onLayout={handleLayout}>
        {viewport && (
          <ZoomPan
            ref={zoomPanRef}
            viewportWidth={viewport.width}
            viewportHeight={viewport.height}
            minScale={fitScale}
            maxScale={maxScale}
          >
            <View style={{ width: PLANTA_NATIVE_WIDTH, height: PLANTA_NATIVE_HEIGHT }}>
              <Image
                source={PLANTA_IMAGE}
                style={styles.plantaImage}
                resizeMode="contain"
                accessibilityLabel="Planta do Salão Abrasel"
              />
              {pins.map((pin) => (
                <PlantaPin
                  key={`event-${pin.key}`}
                  x={pin.x}
                  y={pin.y}
                  color={STATUS_COLOR[getEventStatus(pin.activeEvent)]}
                  highlighted={selection?.kind === "event" && selection.key === pin.key}
                  label={shortMarkerLabel(pin.locationName)}
                  sizeMultiplier={1 / fitScale}
                  onPress={() => setSelection({ kind: "event", key: pin.key })}
                />
              ))}
              {POINTS_OF_INTEREST.map((poi) => (
                <PlantaPin
                  key={`poi-${poi.key}`}
                  x={poi.x}
                  y={poi.y}
                  color={POI_COLOR}
                  highlighted={selection?.kind === "poi" && selection.key === poi.key}
                  label={poi.marker}
                  sizeMultiplier={1 / fitScale}
                  onPress={() => setSelection({ kind: "poi", key: poi.key })}
                />
              ))}
            </View>
          </ZoomPan>
        )}

        <View style={styles.zoomControls}>
          <Pressable
            style={styles.zoomButton}
            onPress={() => zoomPanRef.current?.zoomIn()}
            hitSlop={6}
          >
            <Text style={styles.zoomButtonText}>+</Text>
          </Pressable>
          <Pressable
            style={styles.zoomButton}
            onPress={() => zoomPanRef.current?.zoomOut()}
            hitSlop={6}
          >
            <Text style={styles.zoomButtonText}>–</Text>
          </Pressable>
        </View>
      </View>

      {selectedPin && (
        <EventPreviewCard
          event={selectedPin.activeEvent}
          onClose={() => setSelection(null)}
          onPress={() =>
            navigation.navigate("EventDetail", { eventId: selectedPin.activeEvent.id })
          }
        />
      )}
      {selectedPoi && (
        <PlacePreviewCard label={selectedPoi.label} onClose={() => setSelection(null)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  mapViewport: {
    flex: 1,
    width: "100%",
    overflow: "hidden",
  },
  plantaImage: {
    width: "100%",
    height: "100%",
  },
  zoomControls: {
    position: "absolute",
    right: spacing.sm,
    bottom: spacing.sm,
    gap: spacing.xs,
  },
  zoomButton: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  zoomButtonText: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.marinho,
    lineHeight: 22,
  },
});
