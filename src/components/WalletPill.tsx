import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { spacing, radius, fontSize } from "../theme/spacing";
import { shortenAddress } from "../config/constants";

interface Props {
  address: string | null;
}

/** Compact header chip showing the active wallet address (or "No wallet"). */
export function WalletPill({ address }: Props) {
  return (
    <View style={styles.pill}>
      <Ionicons
        name={address ? "wallet" : "wallet-outline"}
        size={14}
        color={address ? colors.success : colors.textMuted}
      />
      <Text style={styles.text}>{address ? shortenAddress(address) : "No wallet"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.surfaceLight,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  text: { color: colors.text, fontSize: fontSize.sm, fontWeight: "600" },
});
