import { forwardRef, useImperativeHandle, useRef } from "react";
import { Animated, StyleSheet } from "react-native";
import { PanGestureHandler, PinchGestureHandler, State } from "react-native-gesture-handler";

interface Props {
  children: React.ReactNode;
  viewportWidth: number;
  viewportHeight: number;
  /** Menor escala permitida — o "encaixar na tela" (conteúdo é renderizado
   * na resolução nativa da imagem, então isso normalmente é < 1). */
  minScale: number;
  /** Maior escala permitida. */
  maxScale: number;
}

export interface ZoomPanHandle {
  /** Centraliza o ponto (em pixels, na escala 1x do conteúdo, ou seja, na
   * resolução nativa da imagem) na viewport. */
  centerOn: (x: number, y: number, targetScale: number) => void;
  /** Aumenta/diminui o zoom mantendo centralizado o ponto que já está no
   * meio da tela — é o que os botões de zoom usam. */
  zoomIn: () => void;
  zoomOut: () => void;
}

const ZOOM_STEP = 1.5;

// Pinch-to-zoom + pan sobre a planta do evento. Segue o padrão clássico do
// react-native-gesture-handler: escala/translação "base" (persistida entre
// gestos) + escala/translação "delta" do gesto em andamento, somadas via
// Animated.multiply/add e tudo com useNativeDriver.
export const ZoomPan = forwardRef<ZoomPanHandle, Props>(function ZoomPan(
  { children, viewportWidth, viewportHeight, minScale, maxScale },
  ref
) {
  const baseScale = useRef(new Animated.Value(minScale)).current;
  const pinchScale = useRef(new Animated.Value(1)).current;
  const scale = useRef(Animated.multiply(baseScale, pinchScale)).current;
  const lastScale = useRef(minScale);

  const baseTranslateX = useRef(new Animated.Value(0)).current;
  const baseTranslateY = useRef(new Animated.Value(0)).current;
  const panTranslateX = useRef(new Animated.Value(0)).current;
  const panTranslateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(Animated.add(baseTranslateX, panTranslateX)).current;
  const translateY = useRef(Animated.add(baseTranslateY, panTranslateY)).current;
  const lastOffset = useRef({ x: 0, y: 0 });

  const pinchRef = useRef(null);
  const panRef = useRef(null);

  // Centraliza `(x,y)` (em pixels, escala 1x do conteúdo) na viewport, na
  // escala `targetScale`. Único lugar que sabe da matemática do pivô central
  // do CSS `scale` — tanto `centerOn` quanto os botões de zoom passam por
  // aqui.
  const applyTransform = (x: number, y: number, targetScale: number) => {
    const clampedScale = Math.min(Math.max(targetScale, minScale), maxScale);
    lastScale.current = clampedScale;
    baseScale.setValue(clampedScale);
    pinchScale.setValue(1);

    // O CSS aplica `scale` em torno do centro do elemento por padrão (não
    // do canto superior esquerdo), então o translate precisa compensar
    // esse pivô central — daí o `viewportWidth/2` também ser multiplicado
    // pela escala aqui (senão só funciona certo quando scale === 1).
    const offsetX = clampedScale * (viewportWidth / 2 - x);
    const offsetY = clampedScale * (viewportHeight / 2 - y);
    lastOffset.current = { x: offsetX, y: offsetY };
    baseTranslateX.setValue(offsetX);
    baseTranslateY.setValue(offsetY);
    panTranslateX.setValue(0);
    panTranslateY.setValue(0);
  };

  // Inverso de applyTransform: descobre qual ponto do conteúdo está
  // atualmente no centro da viewport, a partir da última escala/translação
  // aplicadas — usado pelos botões de zoom pra "zoomar no que já está sendo
  // visto" em vez de recentralizar em outro lugar.
  const currentCenter = () => ({
    x: viewportWidth / 2 - lastOffset.current.x / lastScale.current,
    y: viewportHeight / 2 - lastOffset.current.y / lastScale.current,
  });

  useImperativeHandle(ref, () => ({
    centerOn: (x, y, targetScale) => applyTransform(x, y, targetScale),
    zoomIn: () => {
      const { x, y } = currentCenter();
      applyTransform(x, y, lastScale.current * ZOOM_STEP);
    },
    zoomOut: () => {
      const { x, y } = currentCenter();
      applyTransform(x, y, lastScale.current / ZOOM_STEP);
    },
  }));

  const onPinchEvent = Animated.event([{ nativeEvent: { scale: pinchScale } }], {
    useNativeDriver: true,
  });

  const onPinchStateChange = (event: {
    nativeEvent: { oldState: number; scale: number };
  }) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      lastScale.current *= event.nativeEvent.scale;
      lastScale.current = Math.min(Math.max(lastScale.current, minScale), maxScale);
      baseScale.setValue(lastScale.current);
      pinchScale.setValue(1);
    }
  };

  const onPanEvent = Animated.event(
    [{ nativeEvent: { translationX: panTranslateX, translationY: panTranslateY } }],
    { useNativeDriver: true }
  );

  const onPanStateChange = (event: {
    nativeEvent: { oldState: number; translationX: number; translationY: number };
  }) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      lastOffset.current.x += event.nativeEvent.translationX;
      lastOffset.current.y += event.nativeEvent.translationY;
      baseTranslateX.setValue(lastOffset.current.x);
      baseTranslateY.setValue(lastOffset.current.y);
      panTranslateX.setValue(0);
      panTranslateY.setValue(0);
    }
  };

  return (
    <PanGestureHandler
      ref={panRef}
      simultaneousHandlers={pinchRef}
      onGestureEvent={onPanEvent}
      onHandlerStateChange={onPanStateChange}
      minPointers={1}
      maxPointers={2}
    >
      <Animated.View style={styles.flex}>
        <PinchGestureHandler
          ref={pinchRef}
          simultaneousHandlers={panRef}
          onGestureEvent={onPinchEvent}
          onHandlerStateChange={onPinchStateChange}
        >
          <Animated.View
            style={[
              styles.flex,
              { transform: [{ translateX }, { translateY }, { scale }] },
            ]}
          >
            {children}
          </Animated.View>
        </PinchGestureHandler>
      </Animated.View>
    </PanGestureHandler>
  );
});

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});
