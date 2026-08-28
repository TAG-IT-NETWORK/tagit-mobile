import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { colors } from "../theme/colors";
import { spacing, radius, fontSize } from "../theme/spacing";
import { stateColor, stateLabel } from "../vault/lifecycle";
import { gridImageUri, listedBadgeLabel, type PricedAsset } from "../vault/display";
import { AssetImage } from "./AssetImage";

interface Props {
  /** Summary row; may additionally carry a price block (detail-shaped rows). */
  asset: PricedAsset;
  onPress: () => void;
}

/**
 * Grid card for one owned asset: image (sm CDN thumb with blurhash
 * placeholder, or the cube fallback), title, lifecycle badge, and a
 * "Listed · $xx.xx" badge when the asset is listed with a display price.
 */
export function AssetCard({ asset, onPress }: Props) {
  const badgeColor = stateColor(asset.stateCode);
  const listedLabel = listedBadgeLabel(asset);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.imageWrap}>
        <AssetImage
          uri={gridImageUri(asset)}
          blurhash={asset.blurhash}
          recyclingKey={asset.tokenId}
          style={styles.image}
          fallbackIconSize={40}
        />
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
      {listedLabel ? (
        <View style={styles.listedBadge}>
          <Text style={styles.listedText}>{listedLabel}</Text>
        </View>
      ) : null}
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
  listedBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.successDim,
    borderColor: colors.success,
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginTop: spacing.xs,
  },
  listedText: { color: colors.success, fontSize: fontSize.xs, fontWeight: "700" },
});
