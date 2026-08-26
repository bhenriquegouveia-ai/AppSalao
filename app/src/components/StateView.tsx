import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../constants/theme";

export function LoadingState({ label = "Carregando..." }: { label?: string }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator color={colors.primary} size="large" />
      <Text style={styles.message}>{label}</Text>
    </View>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Não foi possível carregar</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <Pressable style={styles.button} onPress={onRetry}>
          <Text style={styles.buttonText}>Tentar novamente</Text>
        </Pressable>
      )}
    </View>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  message: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  button: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
