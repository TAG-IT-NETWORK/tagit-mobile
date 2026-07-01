import React from "react";
import { View, Text, Image, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { spacing, radius, fontSize } from "../theme/spacing";
import { stateColor, stateLabel } from "../vault/lifecycle";
import type { AssetSummary } from "../vault/types";

interface Props {
  asset: AssetSummary;
  onPress: () => void;
}

/** Grid card for one owned asset: image (or fallback), title, lifecycle badge. */
export function AssetCard({ asset, onPress }: Props) {
  const badgeColor = stateColor(asset.stateCode);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.imageWrap}>
        {asset.image ? (
          <Image source={{ uri: asset.image }} style={styles.image} resizeMode="cover" />
        ) : (
          <Ionicons name="cube-outline" size={40} color={colors.textMuted} />
        )}
      </View>
      <Text style={styles.title} numberOfLines={1}>
        {asset.name ?? `Asset #${asset.tokenId}`}
      </Text>
      <View style={styles.row}>
        <Text style={styles.tokenId}>#{asset.tokenId}</Text>
        <View style={[styles.badge, { backgroundColor: badgeColor + "22", borderColor: badgeColor }]}>
          <Text style={[styles.badgeText, { color: badgeColor }]}>
            {stateLabel(asset.stateCode)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    margin: spacing.xs,
  },
  pressed: { opacity: 0.8 },
  imageWrap: {
    aspectRatio: 1,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginBottom: spacing.sm,
  },
  image: { width: "100%", height: "100%" },
  title: { color: colors.text, fontSize: fontSize.md, fontWeight: "600" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.xs,
  },
  tokenId: { color: colors.textMuted, fontSize: fontSize.sm },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  badgeText: { fontSize: fontSize.xs, fontWeight: "700" },
});
