import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../theme/colors";
import { spacing, radius, fontSize } from "../theme/spacing";
import type { Challenge } from "../types/challenge";

interface ChallengeCardProps {
  challenge: Challenge;
}

export function ChallengeCard({ challenge }: ChallengeCardProps) {
  const shortNonce =
    challenge.nonce.length > 16
      ? challenge.nonce.slice(0, 8) + "..." + challenge.nonce.slice(-8)
      : challenge.nonce;

  const time = new Date(challenge.timestamp).toLocaleTimeString();

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Challenge Nonce</Text>

      <View style={styles.row}>
        <Text style={styles.label}>Nonce</Text>
        <Text style={styles.valueMono}>{shortNonce}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Timestamp</Text>
        <Text style={styles.value}>{time}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Device ID</Text>
        <Text style={styles.valueMono}>{challenge.deviceId}</Text>
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
