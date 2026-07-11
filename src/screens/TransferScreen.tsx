import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatEther, type Address } from "viem";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useWallet } from "../wallet/useWallet";
import { useTransfer } from "../wallet/useTransfer";
import { validateRecipient, decodeTransfer, groupAddress, InvalidRecipientError } from "../wallet/transfer";
import { colors } from "../theme/colors";
import { spacing, radius, fontSize } from "../theme/spacing";
import type { VaultStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<VaultStackParamList, "Transfer">;

export function TransferScreen({ route, navigation }: Props) {
  const { tokenId, assetName } = route.params;
  const { activeAddress } = useWallet();
  const from = activeAddress as Address | null;
  const { phase, prepared, txHash, error, prepare, confirm, reset } = useTransfer(
    (from ?? "0x0000000000000000000000000000000000000000") as Address,
    BigInt(tokenId),
  );

  const [recipient, setRecipient] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);

  // Authoritative preview — derived from the calldata that will be signed,
  // NOT from UI state (anti preview-spoofing).
  const decoded = useMemo(
    () => (prepared ? decodeTransfer(prepared.calldata) : null),
    [prepared],
  );
  const gasEth = useMemo(() => {
    if (!prepared) return null;
    return formatEther(prepared.gas * prepared.maxFeePerGas);
  }, [prepared]);

  if (!from) {
    return (
      <View style={styles.center}>
        <Text style={styles.err}>No wallet on this device.</Text>
      </View>
    );
  }

  const onReview = () => {
    setInputError(null);
    try {
      const to = validateRecipient(recipient, from);
      void prepare(to);
    } catch (e) {
      setInputError(e instanceof InvalidRecipientError ? e.message : "Invalid recipient.");
    }
  };

  // ---- Entry ----
  if (phase === "idle" || phase === "preparing" || (phase === "error" && !prepared)) {
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.h1}>Send asset #{tokenId}</Text>
        {assetName ? <Text style={styles.sub}>{assetName}</Text> : null}

        <Text style={styles.label}>Recipient wallet address</Text>
        <TextInput
          style={styles.input}
          value={recipient}
          onChangeText={setRecipient}
          placeholder="0x…"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          editable={phase !== "preparing"}
        />
        {inputError ? <Text style={styles.err}>{inputError}</Text> : null}
        {phase === "error" && error ? <Text style={styles.err}>{error}</Text> : null}

        <Pressable
          onPress={onReview}
          disabled={phase === "preparing"}
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed, phase === "preparing" && styles.disabled]}
        >
          {phase === "preparing" ? (
            <ActivityIndicator color={colors.textInverse} />
          ) : (
            <Text style={styles.primaryText}>Review transfer</Text>
          )}
        </Pressable>
        <Text style={styles.note}>
          Transfers are irreversible. This sends the asset out of your wallet on Base Sepolia.
        </Text>
      </ScrollView>
    );
  }

  // ---- Confirmed ----
  if (phase === "confirmed") {
    return (
      <View style={styles.center}>
        <Ionicons name="checkmark-circle" size={64} color={colors.success} />
        <Text style={styles.h1}>Asset sent</Text>
        <Text style={styles.sub}>Asset #{tokenId} was transferred.</Text>
        {txHash ? <Text style={styles.mono}>{txHash.slice(0, 14)}…{txHash.slice(-6)}</Text> : null}
        <Pressable onPress={() => navigation.popToTop()} style={({ pressed }) => [styles.primaryBtn, styles.wide, pressed && styles.pressed]}>
          <Text style={styles.primaryText}>Done</Text>
        </Pressable>
      </View>
    );
  }

  // ---- Pending ----
  if (phase === "pending") {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} size="large" />
        <Text style={styles.h1}>Sending…</Text>
        <Text style={styles.sub}>Broadcast to Base Sepolia — confirming on-chain.</Text>
        {txHash ? <Text style={styles.mono}>{txHash.slice(0, 14)}…{txHash.slice(-6)}</Text> : null}
        <Pressable onPress={() => navigation.popToTop()} style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}>
          <Text style={styles.secondaryText}>Close (keeps confirming)</Text>
        </Pressable>
      </View>
    );
  }

  // ---- Review / Signing ----
  const signing = phase === "signing";
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.h1}>Confirm transfer</Text>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>SENDING</Text>
        <Text style={styles.cardValue}>Asset #{decoded?.tokenId?.toString() ?? tokenId}</Text>
        {assetName ? <Text style={styles.advisory}>{assetName} · metadata, not verified here</Text> : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>TO — REVIEW THE FULL ADDRESS</Text>
        <Text style={styles.address}>{decoded ? groupAddress(decoded.to) : ""}</Text>
        <View style={styles.warnRow}>
          <Ionicons name="alert-circle-outline" size={16} color={colors.warning} />
          <Text style={styles.warn}>First-time recipient — check every character.</Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>Network fee (est.)</Text>
        <Text style={styles.metaValue}>~{gasEth ? Number(gasEth).toFixed(6) : "…"} ETH</Text>
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>Network</Text>
        <Text style={styles.metaValue}>Base Sepolia · Testnet</Text>
      </View>

      {error ? <Text style={styles.err}>{error}</Text> : null}

      <Pressable
        onPress={() => void confirm()}
        disabled={signing}
        style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed, signing && styles.disabled]}
      >
        {signing ? (
          <ActivityIndicator color={colors.textInverse} />
        ) : (
          <>
            <Ionicons name="finger-print" size={20} color={colors.textInverse} />
            <Text style={styles.primaryText}>Confirm &amp; sign</Text>
          </>
        )}
      </Pressable>
      <Pressable onPress={reset} disabled={signing} style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}>
        <Text style={styles.secondaryText}>Cancel</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.md },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg, padding: spacing.lg, gap: spacing.md },
  h1: { color: colors.text, fontSize: fontSize.xl, fontWeight: "800", textAlign: "center" },
  sub: { color: colors.textSecondary, fontSize: fontSize.md, textAlign: "center" },
  label: { color: colors.textMuted, fontSize: fontSize.xs, textTransform: "uppercase", letterSpacing: 1, marginTop: spacing.md },
  input: {
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    fontFamily: "monospace",
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  cardLabel: { color: colors.textMuted, fontSize: fontSize.xs, letterSpacing: 1, fontWeight: "700" },
  cardValue: { color: colors.text, fontSize: fontSize.lg, fontWeight: "800" },
  advisory: { color: colors.textMuted, fontSize: fontSize.sm },
  address: { color: colors.text, fontSize: fontSize.md, fontFamily: "monospace", lineHeight: 24 },
  warnRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs, marginTop: spacing.xs },
  warn: { color: colors.warning, fontSize: fontSize.sm, flex: 1 },
  metaRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: spacing.xs },
  metaLabel: { color: colors.textMuted, fontSize: fontSize.md },
  metaValue: { color: colors.text, fontSize: fontSize.md, fontWeight: "600" },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    minHeight: 52,
    marginTop: spacing.sm,
  },
  wide: { alignSelf: "stretch" },
  primaryText: { color: colors.textInverse, fontSize: fontSize.lg, fontWeight: "700" },
  secondaryBtn: { alignItems: "center", paddingVertical: spacing.md },
  secondaryText: { color: colors.textSecondary, fontSize: fontSize.md, fontWeight: "600" },
  disabled: { opacity: 0.6 },
  pressed: { opacity: 0.85 },
  note: { color: colors.textMuted, fontSize: fontSize.sm, textAlign: "center", marginTop: spacing.sm },
  err: { color: colors.error, fontSize: fontSize.sm },
  mono: { color: colors.textSecondary, fontSize: fontSize.sm, fontFamily: "monospace" },
});
