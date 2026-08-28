/**
 * DTO mapping for the tagit-services asset endpoints (META-T38).
 *
 * The server DTO is the source of truth (tagit-services buildAssetDetail):
 * legacy fields are passed through untouched (ADDITIVE ONLY — older builds
 * parse them), the additive product/price/media/verification blocks are kept
 * verbatim, and two client-side conveniences are filled:
 *
 *  - `msrp` / `saleState` hoisted out of the nested price block;
 *  - `thumb` / `blurhash` derived from the hero media entry so the Vault grid
 *    can paint instantly from a summary.
 *
 * Mapping is defensive: every additive field is optional and absent blocks
 * simply stay undefined, so responses from older deployed services parse
 * unchanged.
 */
import type {
  AssetDetail,
  AssetMediaEntry,
  AssetSummary,
} from "./types";

/**
 * Raw owner-list item as the wire may carry it: the serializer marks absent
 * additive fields either by omission or with an explicit `null` — normalize
 * both to "absent" so cached summaries keep the AssetSummary contract.
 */
type RawAssetSummary = Omit<AssetSummary, "thumb" | "blurhash" | "price"> & {
  [K in "thumb" | "blurhash" | "price"]?: AssetSummary[K] | null;
};

/**
 * CDN media object URL: https://media.tagit.network/i/<sha256>/<variant>.webp
 * (mirrors tagit-services mediaObjectKey). Variant suffixes: orig/lg/md/sm/t.
 */
const CDN_VARIANT_RE = /^(https:\/\/[^/]+\/i\/[0-9a-f]{64})\/(orig|lg|md|sm|t)\.webp$/;

/**
 * Rewrite a CDN media URL to another variant ("sm" for grid thumbs).
 * Non-CDN URLs (ipfs gateways, legacy tokenURI images) return undefined —
 * there is no variant to derive.
 */
export function mediaVariantUrl(
  url: string | undefined,
  variant: "orig" | "lg" | "md" | "sm" | "t",
): string | undefined {
  if (!url) return undefined;
  const m = CDN_VARIANT_RE.exec(url);
  return m ? `${m[1]}/${variant}.webp` : undefined;
}

/** The hero media entry (role === "hero"), falling back to the first entry. */
export function heroMedia(media: AssetMediaEntry[] | undefined): AssetMediaEntry | undefined {
  if (!media || media.length === 0) return undefined;
  return media.find((m) => m.role === "hero") ?? media[0];
}

/**
 * Map one raw summary from GET /api/v1/assets. Legacy fields pass through
 * untouched; the additive per-item fields the owner-list endpoint sends
 * (Week-C services) — `thumb`, `blurhash`, `price: { display, saleState }` —
 * are consumed by name, with null/absent normalized to absent so the no-image
 * fallback and no-badge paths stay intact against older deployed services.
 */
export function mapAssetSummary(raw: RawAssetSummary): AssetSummary {
  const { thumb, blurhash, price, ...rest } = raw;
  return {
    ...rest,
    ...(thumb != null ? { thumb } : {}),
    ...(blurhash != null ? { blurhash } : {}),
    ...(price != null ? { price } : {}),
  };
}

/**
 * Map the raw detail body from GET /api/v1/assets/:tokenId onto AssetDetail:
 * verbatim pass-through of every server field + client-side hoists/derived
 * fields (see module docs). Absent optional blocks stay absent.
 */
export function mapAssetDetail(raw: AssetDetail): AssetDetail {
  const hero = heroMedia(raw.media);
  // Variant selection is the CDN URL rewrite — the deployed serializer never
  // sends a variants map, only the hero entry's canonical url.
  const thumb = raw.thumb ?? mediaVariantUrl(hero?.url, "sm");
  const blurhash = raw.blurhash ?? hero?.blurhash;
  const msrp = raw.msrp ?? raw.price?.msrp;
  const saleState = raw.saleState ?? raw.price?.saleState;

  return {
    ...raw,
    ...(thumb !== undefined ? { thumb } : {}),
    ...(blurhash !== undefined ? { blurhash } : {}),
    ...(msrp !== undefined ? { msrp } : {}),
    ...(saleState !== undefined ? { saleState } : {}),
  };
}

/**
 * Project a detail down to its summary (all summary fields incl. the derived
 * thumb/blurhash and the trimmed {display, saleState} price block) — lets a
 * fresh detail fetch refresh the cached Vault cell, badge included.
 */
export function summaryFromDetail(detail: AssetDetail): AssetSummary {
  const mapped = mapAssetDetail(detail);
  return {
    tokenId: mapped.tokenId,
    owner: mapped.owner,
    stateCode: mapped.stateCode,
    lifecycleState: mapped.lifecycleState,
    name: mapped.name,
    image: mapped.image,
    timestamp: mapped.timestamp,
    ...(mapped.thumb !== undefined ? { thumb: mapped.thumb } : {}),
    ...(mapped.blurhash !== undefined ? { blurhash: mapped.blurhash } : {}),
    ...(mapped.price !== undefined
      ? { price: { display: mapped.price.display, saleState: mapped.price.saleState } }
      : {}),
  };
}
