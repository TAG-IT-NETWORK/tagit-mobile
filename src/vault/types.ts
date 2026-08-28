/**
 * Asset DTOs shared between the app and the tagit-services /api/v1/assets
 * endpoint. Keep this in sync with the server response shape.
 */
import type { LifecycleState } from "../config/constants";

/** One owned asset as shown in the Vault list (cheap to fetch). */
export interface AssetSummary {
  tokenId: string;
  owner: string;
  /** Numeric lifecycle state (0..6) from TAGITCore.getAsset. */
  stateCode: number;
  /** Mapped name, e.g. "ACTIVATED". "UNKNOWN" if out of range. */
  lifecycleState: LifecycleState | "UNKNOWN";
  /** Display name resolved from tokenURI metadata, if available. */
  name?: string;
  /** Resolved image URL (ipfs:// already gateway-rewritten server-side). */
  image?: string;
  /** Unix seconds of the asset's last state change. */
  timestamp: number;
  /**
   * Small (sm) CDN variant URL for grid cells, when the asset has processed
   * media (media.tagit.network/i/<sha256>/sm.webp). Additive (META-T38):
   * derived client-side from the detail media[] block today; the server may
   * start sending it on summaries directly — both fill the same field.
   */
  thumb?: string;
  /** Blurhash placeholder of the hero image, for instant grid paint. */
  blurhash?: string;
}

// ── Additive detail blocks (META-T09/T22/T29 services DTO — hand-synced) ──
// Field names/shapes mirror tagit-services buildAssetDetail() exactly.
// ADDITIVE ONLY: never rename or remove fields; older app builds parse them.

/** One media[] entry from the detail DTO. */
export interface AssetMediaEntry {
  /** "hero" | "gallery" (kept open — server may add roles). */
  role: string;
  url: string;
  mime: string;
  /** Tiny inline data-URI placeholder, when a processed media row is linked. */
  lqip?: string;
  /** Blurhash string, when a processed media row is linked. */
  blurhash?: string;
  /** Content hash of the original upload (present on canonical-doc entries). */
  sha256?: string;
  /** Named variant URLs (sm/md/lg/...), when the server sends them. */
  variants?: Record<string, string>;
}

/** product block: catalog identity fields from the anchored metadata doc. */
export interface AssetProduct {
  name?: string;
  brand?: string;
  model?: string;
  sku?: string;
  /** Country of origin (doc.tagit.countryOfOrigin). */
  origin?: string;
  category?: string;
}

/** msrp block nested in price (and hoisted onto AssetDetail for convenience). */
export interface AssetMsrp {
  amount: number;
  currency: string;
}

export type SaleState = "not_for_sale" | "listed" | "sold";

/** price block: canonical pricing DTO from the pricing service. */
export interface AssetPrice {
  tokenId?: string;
  /** Micro-USDC decimal string (settlement truth), null when unpriced. */
  priceUsdc6: string | null;
  /** Human display string ("$1,250.00"), null when unpriced. */
  display: string | null;
  msrp?: AssetMsrp;
  saleState: SaleState;
  version?: number;
  /** Present only while listed. */
  purchase?: {
    payTo: string;
    token: string;
    chainId: number;
    settleEndpoint: string;
  };
  /** Display-only fx conversion — NEVER a settlement input. */
  fx?: {
    currency: string;
    approx: string;
  };
}

/** verification block: metadata anchor trust-rule fields. */
export interface AssetVerification {
  anchoredVersion: number | null;
  latestVersion: number | null;
  anchorStatus: string | null;
  metadataHash: string | null;
  verified: boolean;
}

/** A single provenance/history entry reconstructed from on-chain events. */
export interface ProvenanceEvent {
  /** Event kind: "AssetMinted" | "TagBound" | "StateChanged" | "Transfer". */
  type: string;
  /** Human label, e.g. "Activated" or "Transferred to 0x12…ab". */
  label: string;
  blockNumber: number;
  txHash: string;
  /** Unix seconds, when resolvable from the block. */
  timestamp?: number;
  /** Raw decoded args for advanced display. */
  data?: Record<string, unknown>;
}

/** Full asset detail incl. metadata + provenance timeline. */
export interface AssetDetail extends AssetSummary {
  description?: string;
  tokenURI?: string;
  /** Tag hash bound to this token (bytes32), if bound. */
  tagHash?: string;
  /** Raw flags byte from getAsset. */
  flags: number;
  attributes?: Array<{ trait_type: string; value: string | number }>;
  provenance: ProvenanceEvent[];
  // ── additive blocks (META-T38; absent on legacy/unmigrated tokens) ──
  /** Catalog product identity, when the token has an anchored metadata doc. */
  product?: AssetProduct;
  /** Canonical price block, when a listing row exists. */
  price?: AssetPrice;
  /** Ordered media entries from the anchored doc (hero first by convention). */
  media?: AssetMediaEntry[];
  /** Metadata-anchor verification block. */
  verification?: AssetVerification;
  /**
   * Convenience hoists filled by mapAssetDetail() from price.msrp /
   * price.saleState (the server nests them inside price).
   */
  msrp?: AssetMsrp;
  saleState?: SaleState;
}
