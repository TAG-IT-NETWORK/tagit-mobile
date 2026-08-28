/**
 * Shared asset image (META-T39) — the ONE place the expo-image config lives.
 *
 * Every asset surface (Vault grid, detail hero, verify Result) renders images
 * through this component so caching and placeholder behavior stay identical
 * app-wide:
 *
 *  - `placeholder={{ blurhash }}`: instant paint from the T38-derived hash
 *    while the real image streams in;
 *  - `cachePolicy="memory-disk"`: tiles survive relaunch and render offline;
 *  - `transition={150}`: 150 ms fade from placeholder to image;
 *  - `recyclingKey={tokenId}`: recycled FlatList cells never flash the
 *    previous asset's image.
 *
 * No-image fallback keeps the current layout: the same centered cube icon the
 * pre-image cards rendered, inside whatever wrapper the caller lays out —
 * zero layout shift.
 */
import React from "react";
import type { ImageStyle, StyleProp } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";

/** Placeholder → image fade duration (ms). */
export const IMAGE_TRANSITION_MS = 150;

interface Props {
  /** Resolved image URL. Undefined renders the icon fallback unchanged. */
  uri: string | undefined;
  /** Blurhash placeholder painted while the image loads. */
  blurhash?: string;
  /** Token id — keeps recycled list cells from showing a stale image. */
  recyclingKey: string;
  /** Style for the loaded image (typically fill-parent). */
  style?: StyleProp<ImageStyle>;
  /** Fallback cube-icon size: 40 in grid cells, 64 on the detail hero. */
  fallbackIconSize?: number;
}

export function AssetImage({
  uri,
  blurhash,
  recyclingKey,
  style,
  fallbackIconSize = 40,
}: Props) {
  if (!uri) {
    return (
      <Ionicons name="cube-outline" size={fallbackIconSize} color={colors.textMuted} />
    );
  }
  return (
    <Image
      source={{ uri }}
      placeholder={blurhash ? { blurhash } : undefined}
      placeholderContentFit="cover"
      contentFit="cover"
      cachePolicy="memory-disk"
      transition={IMAGE_TRANSITION_MS}
      recyclingKey={recyclingKey}
      style={style}
    />
  );
}
