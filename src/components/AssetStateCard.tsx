import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../theme/colors";
import { spacing, radius, fontSize } from "../theme/spacing";
import {
  STATE_COLORS,
  STATE_DISPLAY_NAMES,
  shortenAddress,
  formatTimestamp,
} from "../config/constants";

interface AssetStateCardProps {
  lifecycleState: string;
  stateCode: number;
  owner: string;
  timestamp: number;
  tokenId: string;
}

export function AssetStateCard({
  lifecycleState,
  stateCode,
  owner,
  timestamp,
  tokenId,
}: AssetStateCardProps) {
  const stateColor = STATE_COLORS[lifecycleState] ?? STATE_COLORS.UNKNOWN;
  const stateName = STATE_DISPLAY_NAMES[lifecycleState] ?? lifecycleState;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Asset Info</Text>

      <View style={styles.row}>
        <Text style={styles.label}>Token ID</Text>
        <Text style={styles.value}>#{tokenId}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>State</Text>
        <View style={[styles.badge, { backgroundColor: stateColor + "25", borderColor: stateColor }]}>
          <Text style={[styles.badgeText, { color: stateColor }]}>
            {stateName} ({stateCode})
          </Text>
        </View>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Owner</Text>
        <Text style={styles.valueMono}>{shortenAddress(owner)}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Timestamp</Text>
        <Text style={styles.value}>{formatTimestamp(timestamp)}</Text>
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
    color: colors.text,
    fontFamily: "monospace",
    fontWeight: "500",
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: "700",
  },
});
