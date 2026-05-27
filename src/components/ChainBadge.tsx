import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../theme/colors";
import { spacing, radius, fontSize } from "../theme/spacing";

interface ChainBadgeProps {
  chainId: number;
  chainName: string;
}

export function ChainBadge({ chainId, chainName }: ChainBadgeProps) {
  return (
    <View style={styles.badge}>
      <View style={styles.dot} />
      <Text style={styles.text}>
        {chainName} ({chainId})
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  text: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: "600",
  },
});
