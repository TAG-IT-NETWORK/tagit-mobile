import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { spacing, radius, fontSize } from "../theme/spacing";

interface StatusIndicatorProps {
  verified: boolean;
}

export function StatusIndicator({ verified }: StatusIndicatorProps) {
  const color = verified ? colors.verified : colors.unverified;
  const bgColor = verified ? colors.successDim : colors.errorDim;
  const label = verified ? "VERIFIED" : "UNVERIFIED";

  return (
    <View
      style={[styles.container, { backgroundColor: bgColor, borderColor: color }]}
      accessibilityRole="image"
      accessibilityLabel={label}
    >
      <Ionicons name={verified ? "checkmark-circle" : "close-circle"} size={28} color={color} />
      <Text style={[styles.label, { color }]} numberOfLines={1} adjustsFontSizeToFit>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 2,
    gap: spacing.sm,
  },
  icon: {
    fontSize: fontSize.xxl,
    fontWeight: "bold",
  },
  label: {
    fontSize: fontSize.xl,
    fontWeight: "800",
    letterSpacing: 2,
  },
});
