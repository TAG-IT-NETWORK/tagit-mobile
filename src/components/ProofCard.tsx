import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../theme/colors";
import { spacing, radius, fontSize } from "../theme/spacing";
import { shortenAddress, shortenHash } from "../config/constants";

interface ProofCardProps {
  signature: string;
  messageHash: string;
  oracleAddress: string;
  counter: number;
  timestamp: number;
}

export function ProofCard({
  signature,
  messageHash,
  oracleAddress,
  counter,
  timestamp,
}: ProofCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Oracle Proof</Text>

      <View style={styles.row}>
        <Text style={styles.label}>Oracle</Text>
        <Text style={styles.valueMono}>{shortenAddress(oracleAddress)}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Signature</Text>
        <Text style={styles.valueMono}>{shortenHash(signature)}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Message Hash</Text>
        <Text style={styles.valueMono}>{shortenHash(messageHash)}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>NFC Counter</Text>
        <Text style={styles.value}>{counter}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Signed At</Text>
        <Text style={styles.value}>
          {new Date(timestamp * 1000).toLocaleTimeString()}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  value: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: "500",
  },
  valueMono: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontFamily: "monospace",
    fontWeight: "500",
  },
});
