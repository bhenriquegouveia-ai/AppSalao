import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { Animated, Platform, StyleSheet, View } from "react-native";
import { PanGestureHandler, PinchGestureHandler, State } from "react-native-gesture-handler";
import {
  centerForFixedPoint,
  clampCenter,
  clampScale,
  mapPointAtScreen,
  Point,
} from "./zoomMath";

interface Props {
  children: React.ReactNode;
  viewportWidth: number;
  viewportHeight: number;
  contentWidth: number;
  contentHeight: number;
  /** Escala mínima (normalmente a escala "cover" — conteúdo cobre a viewport
   * inteira, nunca menos que isso). */
  minScale: number;
  maxScale: number;
  /** Chamado sempre que escala/centro mudam — o MapScreen usa isso pra
   * manter o minimapa em sincronia com o que está sendo visto. */
  onViewportChange?: (state: { scale: number; center: Point }) => void;
}

export interface ZoomPanHandle {
  /** Centraliza (com transição suave) o ponto (coordenadas nativas do
   * conteúdo) na viewport, na escala dada — sempre respeitando os limites. */
  centerOn: (x: number, y: number, targetScale: number) => void;
  /** Aumenta/diminui o zoom em torno do centro da viewport (usado pelos
   * botões +/-). */
  zoomIn: () => void;
  zoomOut: () => void;
}

const ZOOM_STEP = 1.5;
const ANIMATION_MS = 260;

// Visualizador de pan/zoom com limites rígidos: o conteúdo nunca pode ser
// visto em escala menor que "cover" (cobre a viewport inteira) e o usuário
// nunca consegue arrastar a área visível pra fora do conteúdo — ambas as
// coisas são garantidas centralizando toda a matemática em `zoomMath.ts` e
// sempre passando por `clampScale`/`clampCenter` antes de aplicar qualquer
// mudança (gesto, botão, ou o `centerOn` inicial).
//
// Estado "de verdade" fica em refs simples (scale + o ponto do conteúdo que
// está no centro da tela) — os `Animated.Value` são só a projeção desse
// estado pra estilo, atualizados via `.setValue()`. Isso permite recalcular
// e travar os limites a cada frame de gesto (em JS), o que não dá pra fazer
// com a composição base+delta via `Animated.add`/`multiply` + native driver
// usada antes (o driver nativo não deixa o JS interceptar/clampar por
// frame).
export const ZoomPan = forwardRef<ZoomPanHandle, Props>(function ZoomPan(
  {
    children,
    viewportWidth,
    viewportHeight,
    contentWidth,
    contentHeight,
    minScale,
    maxScale,
    onViewportChange,
  },
  ref
) {
  const scaleAnim = useRef(new Animated.Value(minScale)).current;
  const translateXAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;

  const scaleRef = useRef(minScale);
  const centerRef = useRef<Point>({ x: contentWidth / 2, y: contentHeight / 2 });

  const panStartCenterRef = useRef<Point>({ x: 0, y: 0 });
  const pinchLastScaleRef = useRef(1);

  const pinchRef = useRef(null);
  const panRef = useRef(null);
  const containerRef = useRef<View>(null);

  const viewport = { width: viewportWidth, height: viewportHeight };
  const content = { width: contentWidth, height: contentHeight };

  // Aplica escala/centro já validados: atualiza os refs (fonte da verdade),
  // projeta pra translateX/Y (mesma fórmula de sempre: pivô no centro da
  // própria viewport) e avisa quem está ouvindo (minimapa).
  const commit = (scale: number, center: Point, animated: boolean) => {
    scaleRef.current = scale;
    centerRef.current = center;

    const offsetX = viewportWidth / 2 - scale * center.x;
    const offsetY = viewportHeight / 2 - scale * center.y;

    if (animated) {
      Animated.parallel([
        Animated.timing(scaleAnim, { toValue: scale, duration: ANIMATION_MS, useNativeDriver: true }),
        Animated.timing(translateXAnim, { toValue: offsetX, duration: ANIMATION_MS, useNativeDriver: true }),
        Animated.timing(translateYAnim, { toValue: offsetY, duration: ANIMATION_MS, useNativeDriver: true }),
      ]).start();
    } else {
      scaleAnim.setValue(scale);
      translateXAnim.setValue(offsetX);
      translateYAnim.setValue(offsetY);
    }

    onViewportChange?.({ scale, center });
  };

  const applyTransform = (x: number, y: number, targetScale: number, animated: boolean) => {
    const scale = clampScale(targetScale, minScale, maxScale);
    const center = clampCenter({ x, y }, scale, viewport, content);
    commit(scale, center, animated);
  };

  // Se a viewport muda de tamanho (rotação, resize da janela) ou os limites
  // de escala mudam (a "cover" depende da viewport), reaplica os limites
  // mantendo o mesmo ponto do mapa centralizado sempre que possível.
  useEffect(() => {
    applyTransform(centerRef.current.x, centerRef.current.y, scaleRef.current, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewportWidth, viewportHeight, contentWidth, contentHeight, minScale, maxScale]);

  useImperativeHandle(ref, () => ({
    centerOn: (x, y, targetScale) => applyTransform(x, y, targetScale, true),
    zoomIn: () => {
      const center = { x: viewportWidth / 2, y: viewportHeight / 2 };
      const mapPoint = mapPointAtScreen(center, viewport, scaleRef.current, centerRef.current);
      const newScale = clampScale(scaleRef.current * ZOOM_STEP, minScale, maxScale);
      const newCenter = centerForFixedPoint(mapPoint, center, viewport, newScale);
      applyTransform(newCenter.x, newCenter.y, newScale, true);
    },
    zoomOut: () => {
      const center = { x: viewportWidth / 2, y: viewportHeight / 2 };
      const mapPoint = mapPointAtScreen(center, viewport, scaleRef.current, centerRef.current);
      const newScale = clampScale(scaleRef.current / ZOOM_STEP, minScale, maxScale);
      const newCenter = centerForFixedPoint(mapPoint, center, viewport, newScale);
      applyTransform(newCenter.x, newCenter.y, newScale, true);
    },
  }));

  // --- Pan (arrastar com 1 dedo / mouse) ---------------------------------
  const onPanStateChange = (event: { nativeEvent: { state: number } }) => {
    if (event.nativeEvent.state === State.BEGAN) {
      panStartCenterRef.current = { ...centerRef.current };
    }
  };

  const onPanGestureEvent = (event: {
    nativeEvent: { translationX: number; translationY: number };
  }) => {
    const { translationX, translationY } = event.nativeEvent;
    const scale = scaleRef.current;
    const proposed: Point = {
      x: panStartCenterRef.current.x - translationX / scale,
      y: panStartCenterRef.current.y - translationY / scale,
    };
    const center = clampCenter(proposed, scale, viewport, content);
    commit(scale, center, false);
  };

  // --- Pinça (zoom com 2 dedos, ancorado no ponto médio dos dedos) -------
  const onPinchStateChange = (event: { nativeEvent: { state: number } }) => {
    if (event.nativeEvent.state === State.BEGAN) {
      pinchLastScaleRef.current = 1;
    }
  };

  const onPinchGestureEvent = (event: {
    nativeEvent: { scale: number; focalX: number; focalY: number };
  }) => {
    const { scale: cumulativeScale, focalX, focalY } = event.nativeEvent;
    const focal = { x: focalX, y: focalY };

    // Fator incremental desde o último evento (o `scale` do gesture-handler
    // é cumulativo desde o início do gesto, não incremental).
    const incremental = cumulativeScale / pinchLastScaleRef.current;
    pinchLastScaleRef.current = cumulativeScale;

    const mapPointUnderFinger = mapPointAtScreen(focal, viewport, scaleRef.current, centerRef.current);
    const newScale = clampScale(scaleRef.current * incremental, minScale, maxScale);
    const newCenterRaw = centerForFixedPoint(mapPointUnderFinger, focal, viewport, newScale);
    const newCenter = clampCenter(newCenterRaw, newScale, viewport, content);

    commit(newScale, newCenter, false);
  };

  // --- Wheel do mouse (desktop), ancorado no cursor ----------------------
  useEffect(() => {
    if (Platform.OS !== "web") return;
    // RNW encaminha a ref de View pro nó DOM real por baixo.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const node = containerRef.current as unknown as HTMLElement | null;
    if (!node) return;

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();

      const rect = node.getBoundingClientRect();
      const cursor = { x: event.clientX - rect.left, y: event.clientY - rect.top };

      const factor = Math.exp(-event.deltaY * 0.0015);
      const newScale = clampScale(scaleRef.current * factor, minScale, maxScale);

      const mapPointUnderCursor = mapPointAtScreen(cursor, viewport, scaleRef.current, centerRef.current);
      const newCenterRaw = centerForFixedPoint(mapPointUnderCursor, cursor, viewport, newScale);
      const newCenter = clampCenter(newCenterRaw, newScale, viewport, content);

      commit(newScale, newCenter, false);
    };

    node.addEventListener("wheel", handleWheel, { passive: false });
    return () => node.removeEventListener("wheel", handleWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewportWidth, viewportHeight, contentWidth, contentHeight, minScale, maxScale]);

  return (
    <View ref={containerRef} style={styles.flex}>
      <PanGestureHandler
        ref={panRef}
        simultaneousHandlers={pinchRef}
        onGestureEvent={onPanGestureEvent}
        onHandlerStateChange={onPanStateChange}
        minPointers={1}
        maxPointers={2}
      >
        <Animated.View style={styles.flex}>
          <PinchGestureHandler
            ref={pinchRef}
            simultaneousHandlers={panRef}
            onGestureEvent={onPinchGestureEvent}
            onHandlerStateChange={onPinchStateChange}
          >
            <Animated.View
              style={[
                styles.flex,
                {
                  transform: [
                    { translateX: translateXAnim },
                    { translateY: translateYAnim },
                    { scale: scaleAnim },
                  ],
                },
              ]}
            >
              {children}
            </Animated.View>
          </PinchGestureHandler>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
});

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});
