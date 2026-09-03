import { Pressable, StyleSheet, Text } from "react-native";
import { colors, radius, spacing } from "../../constants/theme";

interface Props {
  label: string;
  active: boolean;
  onPress: () => void;
}

export function FilterChip({ label, active, onPress }: Props) {
  return (
    <Pressable
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
    >
      <Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    // Altura fixa (em vez de só depender de paddingVertical) garante que a
    // caixa nunca cresça verticalmente ao selecionar, seja qual for a causa.
    height: 34,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.xs,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  label: {
    fontSize: 13,
    color: colors.text,
    textTransform: "capitalize",
  },
  labelActive: {
    // Cor sozinha já indica o estado selecionado — mudar fontWeight aqui
    // alterava a largura do texto (negrito é mais largo) e fazia a caixa
    // crescer, já que ela não tem largura fixa.
    color: "#fff",
  },
});
