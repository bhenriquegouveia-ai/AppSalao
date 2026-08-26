import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../constants/theme";

interface Props {
  width: number;
  height: number;
}

// Planta real do Salão Abrasel ainda não foi fornecida (PNG/SVG). Este
// placeholder mantém as proporções e o grid para posicionar os pins — basta
// trocar por um <Image source={require('../../../assets/planta.png')} />
// do mesmo tamanho quando o arquivo real chegar.
export function PlantaPlaceholder({ width, height }: Props) {
  const columns = 6;
  const rows = 8;

  return (
    <View style={[styles.container, { width, height }]}>
      {Array.from({ length: rows }).map((_, row) => (
        <View key={row} style={styles.row}>
          {Array.from({ length: columns }).map((_, col) => (
            <View key={col} style={[styles.cell, { width: width / columns }]} />
          ))}
        </View>
      ))}
      <Text style={styles.label}>Planta ilustrativa (placeholder)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: {
    flexDirection: "row",
    flex: 1,
  },
  cell: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  label: {
    position: "absolute",
    bottom: 8,
    alignSelf: "center",
    fontSize: 11,
    color: colors.textMuted,
  },
});
