import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../theme/colors";
import { spacing, radius, fontSize } from "../theme/spacing";
import type { SunData } from "../types/nfc";

interface NfcDataCardProps {
  sunData: SunData;
}

export function NfcDataCard({ sunData }: NfcDataCardProps) {
  const shortCmac =
    sunData.cmac.length > 12
      ? sunData.cmac.slice(0, 6) + "..." + sunData.cmac.slice(-6)
      : sunData.cmac;

  const counterDec = sunData.ctr ? parseInt(sunData.ctr, 16) : 0;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>NFC Tag Data</Text>

      <View style={styles.row}>
        <Text style={styles.label}>UID</Text>
        <Text style={styles.valueMono}>{sunData.uid}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Counter</Text>
        <Text style={styles.valueMono}>
          0x{sunData.ctr} ({counterDec})
        </Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>CMAC</Text>
        <Text style={styles.valueMono}>{shortCmac}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Token ID</Text>
        <Text style={styles.value}>#{sunData.tokenId}</Text>
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
