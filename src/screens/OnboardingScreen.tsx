import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { spacing, radius, fontSize } from "../theme/spacing";

interface Props {
  onCreateEmbedded: () => Promise<unknown>;
  /** WalletConnect path — disabled until a Reown projectId is configured. */
  onConnectExternal?: () => void;
}

/**
 * First-run wallet onboarding, shown when no wallet exists. Offers the gasless
 * on-device wallet (embedded EOA → ERC-4337 smart account) and bring-your-own
 * via WalletConnect (Phase 3 follow-up, gated on projectId).
 */
export function OnboardingScreen({ onCreateEmbedded, onConnectExternal }: Props) {
  const [busy, setBusy] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const handleCreate = async () => {
    setBusy(true);
    setCreateError(null);
    try {
      await onCreateEmbedded();
    } catch (e) {
      // Rendered inline — a rejection here (keystore failure, cancelled
      // biometric prompt) must not vanish as an unhandled rejection.
      setCreateError(e instanceof Error ? e.message : "Could not create the wallet");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <Ionicons name="shield-checkmark" size={56} color={colors.primary} />
      <Text style={styles.title}>Welcome to TAG IT</Text>
      <Text style={styles.subtitle}>
        Your wallet holds your verified physical assets. No seed phrase, no gas —
        secured by this device.
      </Text>

      <Pressable
        onPress={handleCreate}
        disabled={busy}
        style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
      >
        {busy ? (
          <ActivityIndicator color={colors.text} />
        ) : (
          <>
            <Ionicons name="add-circle-outline" size={20} color={colors.text} />
            <Text style={styles.primaryText}>Create my wallet</Text>
          </>
        )}
      </Pressable>

      {createError && <Text style={styles.errorText}>{createError}</Text>}

      <Pressable
        onPress={onConnectExternal}
        disabled={!onConnectExternal}
        style={({ pressed }) => [
          styles.secondaryBtn,
          !onConnectExternal && styles.disabled,
          pressed && styles.pressed,
        ]}
      >
        <Ionicons name="link-outline" size={20} color={colors.textSecondary} />
        <Text style={styles.secondaryText}>
          Connect existing wallet{onConnectExternal ? "" : " (soon)"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
    padding: spacing.xl,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.xxl,
    fontWeight: "800",
    marginTop: spacing.md,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    textAlign: "center",
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    width: "100%",
    minHeight: 52,
  },
  primaryText: { color: colors.text, fontSize: fontSize.lg, fontWeight: "700" },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    width: "100%",
    marginTop: spacing.md,
  },
  secondaryText: { color: colors.textSecondary, fontSize: fontSize.md, fontWeight: "600" },
  errorText: {
    color: colors.error,
    fontSize: fontSize.sm,
    textAlign: "center",
    marginTop: spacing.md,
  },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
});
