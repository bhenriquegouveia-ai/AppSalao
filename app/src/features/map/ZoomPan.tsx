import { forwardRef, useImperativeHandle, useRef } from "react";
import { Animated, StyleSheet } from "react-native";
import { PanGestureHandler, PinchGestureHandler, State } from "react-native-gesture-handler";

interface Props {
  children: React.ReactNode;
  viewportWidth: number;
  viewportHeight: number;
}

export interface ZoomPanHandle {
  /** Centraliza o ponto (em pixels, na escala 1x do conteúdo) na viewport. */
  centerOn: (x: number, y: number, targetScale?: number) => void;
}

const MIN_SCALE = 1;
const MAX_SCALE = 4;

// Pinch-to-zoom + pan sobre a planta do evento. Segue o padrão clássico do
// react-native-gesture-handler: escala/translação "base" (persistida entre
// gestos) + escala/translação "delta" do gesto em andamento, somadas via
// Animated.multiply/add e tudo com useNativeDriver.
export const ZoomPan = forwardRef<ZoomPanHandle, Props>(function ZoomPan(
  { children, viewportWidth, viewportHeight },
  ref
) {
  const baseScale = useRef(new Animated.Value(1)).current;
  const pinchScale = useRef(new Animated.Value(1)).current;
  const scale = useRef(Animated.multiply(baseScale, pinchScale)).current;
  const lastScale = useRef(1);

  const baseTranslateX = useRef(new Animated.Value(0)).current;
  const baseTranslateY = useRef(new Animated.Value(0)).current;
  const panTranslateX = useRef(new Animated.Value(0)).current;
  const panTranslateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(Animated.add(baseTranslateX, panTranslateX)).current;
  const translateY = useRef(Animated.add(baseTranslateY, panTranslateY)).current;
  const lastOffset = useRef({ x: 0, y: 0 });

  const pinchRef = useRef(null);
  const panRef = useRef(null);

  useImperativeHandle(ref, () => ({
    centerOn: (x, y, targetScale = 2) => {
      const clampedScale = Math.min(Math.max(targetScale, MIN_SCALE), MAX_SCALE);
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
      lastScale.current = Math.min(Math.max(lastScale.current, MIN_SCALE), MAX_SCALE);
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
