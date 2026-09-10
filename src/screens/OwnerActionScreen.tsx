/**
 * Confirm screen for one owner action (flag / list / delist / recycle /
 * cancel-recycle). Collects the action's params, explains what happens, then
 * signs the canonical message with the device key (OS biometric / passcode
 * prompt) and submits it to tagit-services, which verifies ownerOf on-chain
 * and executes through the relayer.
 */
import React, { useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Address } from "viem";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useWallet } from "../wallet/useWallet";
import { useOwnerAction } from "../owner-actions/hooks";
import { ACTION_COPY, composeReason } from "../owner-actions/copy";
import { PRICE_RE, RECYCLE_GRACE_HOURS, type OwnerActionParams } from "../owner-actions/message";
import { colors } from "../theme/colors";
import { spacing, radius, fontSize } from "../theme/spacing";
import type { VaultStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<VaultStackParamList, "OwnerAction">;

const TONE: Record<string, string> = {
  warning: colors.warning,
  primary: colors.primary,
  neutral: colors.textSecondary,
  success: colors.success,
};

export function OwnerActionScreen({ route, navigation }: Props) {
  const { tokenId, assetName, action } = route.params;
  const copy = ACTION_COPY[action];
  const { activeAddress } = useWallet();
  const owner = activeAddress as Address | null;
  const { phase, result, error, run, reset } = useOwnerAction();

  const [chip, setChip] = useState(copy.reasons?.[0]?.value ?? "");
  const [note, setNote] = useState("");
  const [price, setPrice] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);

  const params = useMemo<OwnerActionParams>(() => {
    switch (action) {
      case "flag":
        return { reason: composeReason(chip, note) };
      case "recycle":
        return { reason: composeReason(chip, note), method: "self" };
      case "list":
        return { priceUsdc: price.trim() };
      case "delist":
        return note.trim() ? { reason: note.trim() } : {};
      default:
        return {};
    }
  }, [action, chip, note, price]);

  if (!owner) {
    return (
      <View style={styles.center}>
        <Text style={styles.err}>No wallet on this device.</Text>
      </View>
    );
  }

  const validate = (): string | null => {
    if (copy.needsPrice) {
      const p = price.trim();
      if (!PRICE_RE.test(p) || Number(p) <= 0) return "Enter a price in USDC, e.g. 25 or 19.99 (up to 6 decimals).";
    }
    if (copy.reasons && chip === "other" && !note.trim()) return "Tell us briefly what happened.";
    return null;
  };

  const onConfirm = () => {
    const v = validate();
    setInputError(v);
    if (v) return;
    void run({
      tokenId,
      action,
      params,
      owner,
      prompt: `${copy.title} — asset #${tokenId}`,
    });
  };

  const backToAsset = () => navigation.navigate("AssetDetail", { tokenId, refresh: Date.now() });

  // ---- Done ----
  if (phase === "done" && result) {
    const scheduled = result.status === "scheduled";
    const failed = result.status === "failed";
    const when = result.executeAt ? new Date(result.executeAt).toLocaleString() : null;
    return (
      <View style={styles.center}>
        <Ionicons
          name={failed ? "alert-circle" : scheduled ? "time-outline" : "checkmark-circle"}
          size={64}
          color={failed ? colors.error : scheduled ? colors.warning : colors.success}
        />
        <Text style={styles.h1}>{failed ? "Could not complete" : copy.doneTitle}</Text>
        {failed ? (
          <Text style={styles.sub}>{result.error ?? "The network rejected the action. Nothing changed."}</Text>
        ) : scheduled ? (
          <Text style={styles.sub}>
            Asset #{tokenId} will be recycled {when ? `on ${when}` : `in ${RECYCLE_GRACE_HOURS} hours`}. Until then you can cancel from the
            asset page.
          </Text>
        ) : (
          <Text style={styles.sub}>Asset #{tokenId}{assetName ? ` · ${assetName}` : ""}</Text>
        )}
        {result.txHash ? (
          <Text style={styles.mono}>
            {result.txHash.slice(0, 14)}…{result.txHash.slice(-6)}
          </Text>
        ) : null}
        <Pressable onPress={backToAsset} style={({ pressed }) => [styles.primaryBtn, styles.wide, pressed && styles.pressed]}>
          <Text style={styles.primaryText}>Done</Text>
        </Pressable>
      </View>
    );
  }

  const busy = phase === "signing" || phase === "submitting";
  const tone = TONE[copy.tone] ?? colors.primary;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.headRow}>
        <View style={[styles.iconWrap, { borderColor: tone }]}>
          <Ionicons name={copy.icon} size={26} color={tone} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.h1Left}>{copy.title}</Text>
          <Text style={styles.subLeft}>
            Asset #{tokenId}
            {assetName ? ` · ${assetName}` : ""}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>WHAT HAPPENS</Text>
        <Text style={styles.blurb}>{copy.blurb}</Text>
      </View>

      {copy.reasons ? (
        <>
          <Text style={styles.label}>Reason</Text>
          <View style={styles.chips}>
            {copy.reasons.map((r) => {
              const on = r.value === chip;
              return (
                <Pressable
                  key={r.value}
                  onPress={() => setChip(r.value)}
                  disabled={busy}
                  style={[styles.chip, on && { backgroundColor: tone + "22", borderColor: tone }]}
                >
                  <Text style={[styles.chipText, on && { color: tone }]}>{r.label}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.label}>{chip === "other" ? "What happened?" : "Note (optional)"}</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={note}
            onChangeText={setNote}
            placeholder={action === "flag" ? "Where and when, anything that helps the brand" : "Anything to add"}
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={400}
            editable={!busy}
          />
        </>
      ) : null}

      {copy.needsPrice ? (
        <>
          <Text style={styles.label}>Price (USDC)</Text>
          <TextInput
            style={styles.input}
            value={price}
            onChangeText={setPrice}
            placeholder="25.00"
            placeholderTextColor={colors.textMuted}
            keyboardType="decimal-pad"
            editable={!busy}
          />
          <Text style={styles.note}>Paid in USDC on Base Sepolia · settles to your wallet</Text>
        </>
      ) : null}

      {action === "delist" ? (
        <>
          <Text style={styles.label}>Reason (optional)</Text>
          <TextInput
            style={styles.input}
            value={note}
            onChangeText={setNote}
            placeholder="Changed my mind"
            placeholderTextColor={colors.textMuted}
            maxLength={400}
            editable={!busy}
          />
        </>
      ) : null}

      {inputError ? <Text style={styles.err}>{inputError}</Text> : null}
      {phase === "error" && error ? <Text style={styles.err}>{error}</Text> : null}

      <Pressable
        onPress={onConfirm}
        disabled={busy}
        style={({ pressed }) => [styles.primaryBtn, { backgroundColor: copy.tone === "warning" ? colors.warning : colors.primary }, pressed && styles.pressed, busy && styles.disabled]}
      >
        {busy ? (
          <>
            <ActivityIndicator color={colors.textInverse} />
            <Text style={styles.primaryText}>{phase === "signing" ? "Confirming…" : "Submitting…"}</Text>
          </>
        ) : (
          <>
            <Ionicons name="finger-print" size={20} color={colors.textInverse} />
            <Text style={styles.primaryText}>{copy.confirmLabel}</Text>
          </>
        )}
      </Pressable>
      <Text style={styles.note}>You'll confirm with Face ID / fingerprint or your device passcode. Your wallet signs a message — no gas, no funds move.</Text>
      <Pressable
        onPress={() => {
          reset();
          navigation.goBack();
        }}
        disabled={busy}
        style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
      >
        <Text style={styles.secondaryText}>Back</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.md },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg, padding: spacing.lg, gap: spacing.md },
  headRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  h1: { color: colors.text, fontSize: fontSize.xl, fontWeight: "800", textAlign: "center" },
  h1Left: { color: colors.text, fontSize: fontSize.xl, fontWeight: "800" },
  sub: { color: colors.textSecondary, fontSize: fontSize.md, textAlign: "center" },
  subLeft: { color: colors.textSecondary, fontSize: fontSize.md },
  label: { color: colors.textMuted, fontSize: fontSize.xs, textTransform: "uppercase", letterSpacing: 1, marginTop: spacing.sm },
  input: {
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
  },
  multiline: { minHeight: 84, textAlignVertical: "top" },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  cardLabel: { color: colors.textMuted, fontSize: fontSize.xs, letterSpacing: 1, fontWeight: "700" },
  blurb: { color: colors.text, fontSize: fontSize.md, lineHeight: 22 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipText: { color: colors.textSecondary, fontSize: fontSize.md, fontWeight: "600" },
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
  note: { color: colors.textMuted, fontSize: fontSize.sm, textAlign: "center" },
  err: { color: colors.error, fontSize: fontSize.sm },
  mono: { color: colors.textSecondary, fontSize: fontSize.sm, fontFamily: "monospace" },
});
