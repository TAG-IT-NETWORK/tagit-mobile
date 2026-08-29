/**
 * Pure presentation helpers for asset surfaces (META-T39).
 *
 * These functions carry every render decision AssetCard / VaultDetailScreen /
 * ResultScreen make about images and listing badges. Kept free of React /
 * React Native imports so the repo's node-environment Jest runner can test
 * them directly (component rendering isn't supported by the v1 runner — see
 * jest.config.js).
 */
import { heroMedia, mediaVariantUrl } from "./mapAsset";
import type { AssetDetail, AssetSummary, SaleState } from "./types";

/**
 * What a Vault grid cell renders: the sm CDN thumb when T38 derived (or the
 * server sent) one, else the legacy full-size image, else undefined → the
 * cube-icon fallback.
 */
export function gridImageUri(asset: AssetSummary): string | undefined {
  return asset.thumb ?? asset.image;
}

/**
 * What the detail hero renders: the lg CDN variant when derivable (URL
 * rewrite of the hero media URL — the deployed serializer sends no variants
 * map), else the raw hero media URL, else the legacy image, else undefined →
 * the cube-icon fallback.
 */
export function detailImageUri(asset: AssetDetail): string | undefined {
  const hero = heroMedia(asset.media);
  return mediaVariantUrl(hero?.url, "lg") ?? hero?.url ?? asset.image;
}

/**
 * Thumb for the verify Result screen: the sm CDN variant of the verifier-sent
 * image when derivable, else the image as-is (non-CDN URLs have no variants).
 */
export function resultThumbUri(image: string | undefined): string | undefined {
  return mediaVariantUrl(image, "sm") ?? image;
}

/**
 * An asset row that may carry pricing. Summaries carry the trimmed
 * {display, saleState} price block straight off the owner-list endpoint
 * (AssetSummary.price); detail-shaped rows additionally have the hoisted
 * saleState, and their full AssetPrice narrows the summary block.
 */
export type PricedAsset = AssetSummary & {
  saleState?: SaleState;
};

/**
 * "Listed · $xx.xx" badge label — ONLY when the resolved saleState is
 * "listed" AND price.display is present. Anything else (not_for_sale, sold,
 * a listing without a display price, no price block) renders no badge.
 */
export function listedBadgeLabel(asset: PricedAsset): string | undefined {
  const saleState = asset.saleState ?? asset.price?.saleState;
  const display = asset.price?.display;
  if (saleState !== "listed" || !display) return undefined;
  return `Listed · ${display}`;
}
