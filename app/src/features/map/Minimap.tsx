import { GestureResponderEvent, Image, Pressable, StyleSheet, View } from "react-native";
import { colors, radius } from "../../constants/theme";
import { Point, visibleContentRect } from "./zoomMath";

const MINIMAP_WIDTH = 108;

interface Props {
  imageSource: number;
  contentWidth: number;
  contentHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  scale: number;
  center: Point;
  onRecenter: (x: number, y: number) => void;
}

// Visão geral da planta inteira, num canto — mostra um retângulo com a área
// que está sendo vista no mapa principal, atualizado a cada pan/zoom. Tocar
// nele recentraliza o mapa principal ali (mantendo a escala atual).
export function Minimap({
  imageSource,
  contentWidth,
  contentHeight,
  viewportWidth,
  viewportHeight,
  scale,
  center,
  onRecenter,
}: Props) {
  const minimapHeight = MINIMAP_WIDTH * (contentHeight / contentWidth);
  const minimapScale = MINIMAP_WIDTH / contentWidth;

  const rect = visibleContentRect({ width: viewportWidth, height: viewportHeight }, scale, center);
  const rectLeft = clamp(rect.x * minimapScale, 0, MINIMAP_WIDTH);
  const rectTop = clamp(rect.y * minimapScale, 0, minimapHeight);
  const rectWidth = clamp(rect.width * minimapScale, 0, MINIMAP_WIDTH - rectLeft);
  const rectHeight = clamp(rect.height * minimapScale, 0, minimapHeight - rectTop);

  const handlePress = (event: GestureResponderEvent) => {
    const { locationX, locationY } = event.nativeEvent;
    onRecenter(locationX / minimapScale, locationY / minimapScale);
  };

  return (
    <Pressable
      onPress={handlePress}
      style={[styles.container, { width: MINIMAP_WIDTH, height: minimapHeight }]}
    >
      <Image source={imageSource} style={styles.image} resizeMode="cover" />
      <View
        style={[
          styles.viewportRect,
          { left: rectLeft, top: rectTop, width: rectWidth, height: rectHeight },
        ]}
      />
    </Pressable>
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.sm,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    opacity: 0.9,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  image: {
    width: "100%",
    height: "100%",
    opacity: 0.6,
  },
  viewportRect: {
    position: "absolute",
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}33`,
  },
});
